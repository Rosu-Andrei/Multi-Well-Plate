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
         * The payload that is coming back from the web worker is the Set with the well ids that
         * are up for selection
         */
        if (message.type === 'selectionUpdate') {
          this.updateSelectionModel(message.payload);
        } else if (message.type === 'selectionUpdateFromTable') {
          this.updateSelectionFromTable(message.payload);
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

  private updateSelectionModel(selectedWellIds: string[]): void {
    /**
     * we create a well array that will contain only the wells that have been marked by the web
     * worker for selection. The identification is done using the Set<> from the web worker that contains the well ids.
     */
    const selectedWells = this.plateService.getWells().flat().filter((well) => {
        return selectedWellIds.includes(well.id);
      }
    );
    /**
     * First we clear all the selected wells from the SelectionModule object, and then we tell it to select only
     * the wells that are in the newly created array.
     */
    this.selection.clear();
    this.selection.select(...selectedWells);

    /**
     * Emits the updated selection via selectionChangeSubject for any subscribed components. In this way, the
     * changes are communicated to the components.
     */
    this.selectionChangeSubject.next(selectedWells);
  }

  isSelected(well: Well): boolean {
    return this.selection.isSelected(well);
  }

  /**
   * we receive from the table component the wells that have been selected.
   * We extract their ids and, we end those ids to the web worker.
   */
  selectionFromTable(selectedWells: Well[]): void {
    const selectedWellIds = selectedWells.map(well => well.id);
    this.worker.postMessage({type: "updateFromTable", payload: selectedWellIds})
  }

  selectWellById(wellId: string): void {
    if (wellId !== 'clearSelection') {
      this.worker.postMessage({
        type: 'selectWellById',
        payload: {wellId},
      });
    } else {
      this.worker.postMessage({
        type: 'clearSelection',
        payload: {wellId},
      });
    }
  }

  selectTableRowByKey(rowKey: string): void {
    this.tableRowSelectionSubject.next(rowKey);
    this.chartSelectionSubject.next(rowKey);
  }

  updateSelectionFromTable(selectedWellsIds: string[]): void {
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
     * aici sigura diferenta este ca nu emit noul mesaj folosind selectionChangeSubject,
     * si astfel am rezolvat probleme intre selectia unui singur rand si selectarea
     * acelui well in plate.
     */
  }
}
