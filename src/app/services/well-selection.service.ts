import {Injectable} from '@angular/core';
import {PlateService} from './plate.service';
import {Well} from '../model/well';
import {SelectionModel} from '@angular/cdk/collections';
import {Subject} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
/**
 * The WellSelectionService acts as a bridge between the Web Worker and the Angular component, the multi-well.ts file.
 * It manages the selection state using the SelectionModel and communicates with the worker by using messages.
 */
export class WellSelectionService {
  selection = new SelectionModel<Well>(true, []);
  private worker!: Worker;

  /**
   * Subject is type of Observable that can receive data and emit data to which then we subscribe to.
   * This specific subject will emit an array of Well. This will notify any subscriber whenever a selection
   * of wells has changed
   */
  public selectionChangeSubject = new Subject<Well[]>();
  public tableRowSelectionSubject = new Subject<string>();
  public chartSelectionSubject = new Subject<string>();

  /**
   * Subject to emit well selections to the chart when selections are made on the plate.
   */
  public plateSelectionSubject = new Subject<Well[]>();

  /**
   * Subject to emit row key selections to the chart when selections are made in the table.
   */
  public tableSelectionSubject = new Subject<string[]>();

  constructor(private plateService: PlateService) {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(
        new URL('../well-selection.worker.ts', import.meta.url),
        {type: 'module'}
      );
      /**
       * the "onmessage" method is the one that will return the data from the worker, after the worker
       * has done all its job. Think of it as Future Promise.
       */
      this.worker.onmessage = ({data}) => {

        const message = data;
        /**
         * if the message type is equal to "selectionUpdate", this means
         * that a selection update has happened.
         * The payload that is coming back from the web worker is an Array with the well ids that
         * are up for selection
         */
        if (message.type === 'selectionUpdate') {
          this.updateSelectionModel(message.payload);
        } else if (message.type === 'selectionUpdateFromTable') {
          this.updateSelectionFromTable(message.payload);
        } else if (message.type === 'rowKeyUpdate') {
          this.updateTableFromRowKey(message.payload);
        }
      };
      /**
       * the main thread sends to the worker an "initialize" message that will
       * set up the well matrix for it.
       */
      this.initializeWorker();
    } else {
      console.error('Web Workers are not supported in this environment.');
    }
  }

  /**
   * send the well matrix to the web worker.
   */
  initializeWorker(): void {
    this.worker.postMessage({
      type: 'initialize',
      payload: {wells: this.plateService.getWells()},
    });
  }

  /**
   * constructs a payload using the parameters and then sends it to the worker with
   * the message type "toggleWellSelection" so that the message worker will go in the case
   * for a specific well.
   */
  toggleWellSelection(event: MouseEvent, well: Well): void {
    const payload = {
      ctrlPressed: event.ctrlKey || event.metaKey,
      shiftPressed: event.shiftKey,
      well: well,
    };
    this.worker.postMessage({type: 'toggleWellSelection', payload});
  }

  toggleRowSelection(event: MouseEvent, rowIndex: number): void {
    const ctrlPressed = event.ctrlKey || event.metaKey;
    this.worker.postMessage({
      type: 'toggleRowSelection',
      payload: {ctrlPressed, rowIndex},
    });
  }

  toggleColumnSelection(event: MouseEvent, columnIndex: number): void {
    const ctrlPressed = event.ctrlKey || event.metaKey;
    this.worker.postMessage({
      type: 'toggleColumnSelection',
      payload: {ctrlPressed, columnIndex},
    });
  }

  /**
   * Sends a "clearSelection" message to the worker to reset all selections.
   */
  clearSelection(): void {
    this.worker.postMessage({type: 'clearSelection'});
  }

  /**
   * The purpose of this method is to upgrade the SelectionModel based on the computations done
   * by the Web Worker. The Web Worker decides what wells will be selected, and this method only uses
   * the selection model to actually make the selection changes.
   */
  private updateSelectionModel(selectedWellIds: string[]): void {
    /**
     * we create a well array that will contain only the wells that have been marked by the web
     * worker for selection. The identification is done using the Array from the web worker that contains the well ids.
     */
    const selectedWells = this.plateService.getWells().flat().filter((well) => {
      return selectedWellIds.includes(well.id);
    });

    /**
     * we store the currently selected wells before the update takes place.
     */
    const previousSelection = this.selection.selected;
    /**
     * First we clear all the selected wells from the SelectionModule object, and then we tell it to select only
     * the wells that are in the newly created array.
     * With clear. we make sure that only the newly selected wells are parsed.
     */
    this.selection.clear();
    this.selection.select(...selectedWells);

    /**
     * we check if the newly updated selection is different then the previous one.
     */
    const hasSelectionChanged =
      previousSelection.length !== selectedWells.length ||
      !previousSelection.every((well, index) => well.id === selectedWells[index].id);

    /**
     * if there are differences between the old and newly made selection,
     * then we emit changes to the chart and the table, so that they will update accordingly.
     */
    if (hasSelectionChanged) {
      this.plateSelectionSubject.next(selectedWells); // emit changes to the chart
      this.selectionChangeSubject.next(selectedWells); // emit changes to the table
    }
  }


  isSelected(well: Well): boolean {
    return this.selection.isSelected(well);
  }

  /**
   * we receive from the table component the wells that have been selected.
   * We extract their ids and, we send those ids to the web worker.
   */
  selectionFromTable(selectedWells: Well[]): void {
    const selectedWellIds = selectedWells.map(well => well.id);
    this.worker.postMessage({type: "updateFromTable", payload: selectedWellIds});
  }

  selectTableRowByKey(rowKey: string): void {
    this.tableRowSelectionSubject.next(rowKey);
    this.tableSelectionSubject.next([rowKey]);
    this.worker.postMessage({type: "selectRowByRowKey", payload: rowKey});
  }

  private updateSelectionFromTable(selectedWellsIds: string[]): void {
    const selectedWells = this.plateService.getWells().flat().filter((well) => {
        return selectedWellsIds.includes(well.id);
      }
    );
    /**
     * First we clear all the selected wells from the SelectionModule object, and then we tell it to select only
     * the wells that are in the newly created array.
     */
    this.selection.clear();
    this.selection.select(...selectedWells);

    /**
     * this method is very similar to the updateSelectionModel. The main difference is that we don't emit
     * any data using any subject.
     */
  }

  private updateTableFromRowKey(selectedRowKeys: string[]) {
    this.selection.clear();
    const selectedWells: Well[] = [];

    selectedRowKeys.forEach(rowKey => {
      this.tableRowSelectionSubject.next(rowKey);
      const [wellId, targetName] = rowKey.split('_');
      const selectedWell = this.plateService.getFlatWells().find(well => well.id === wellId);
      if (selectedWell) {
        selectedWells.push(selectedWell);
      }
    });

    this.selection.select(...selectedWells);
  }

}
