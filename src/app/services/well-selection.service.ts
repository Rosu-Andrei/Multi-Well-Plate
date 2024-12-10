import {Injectable} from '@angular/core';
import {PlateService} from './plate.service';
import {Well} from '../model/well';
import {Store} from '@ngrx/store';
import {AppState, WellSample} from '../store/well.state';
import {updateSelectedRowKeys, clearSelection} from '../store/well.action';
import {selectAllSamples} from "../store/well.selectors";
import {WellTableRow} from "../components/plate-table/plate-table.component";

@Injectable({
  providedIn: 'root',
})
export class WellSelectionService {
  private worker!: Worker;
  private samples: Record<string, WellSample> = {};

  constructor(private plateService: PlateService, private store: Store<AppState>) {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('../well-selection.worker.ts', import.meta.url), {
        type: 'module',
      });
      /**
       * we listen for messages coming from the web worker.
       */
      this.worker.onmessage = ({data}) => {
        const message = data;

        if (message.type === 'selectionUpdate') {
          this.updateSelectionModel(message.payload); // the payload in this case is the wellIds array: ["A1", "B5"] for example.
        } else if (message.type === 'rowFromTable') {
          this.updateTableFromRowKeys(message.payload);
        }
      };

      this.initializeWorker();
    } else {
      console.error('Web Workers are not supported in this environment.');
    }
    this.store.select(selectAllSamples).subscribe((samples) => {
      this.samples = samples;
    });
  }

  /**
   * this method will send to the web worker the well matrix. It does this so that
   * the web worker has a representation of the well at its disposal for computations such as
   * box selection, row selection, column selection etc.
   */
  initializeWorker(): void {
    this.worker.postMessage({
      type: 'initialize',
      payload: {wells: this.plateService.getWells()},
    });
  }

  /**
   * the method is called from the plate component the moment a user selects a well on the plate.
   */
  toggleWellSelection(event: MouseEvent, well: Well): void {
    /**
     * we construct the payload for the web worker, and then dispatch the appropriate message to the web worker.
     */
    const payload = {
      ctrlPressed: event.ctrlKey || event.metaKey,
      shiftPressed: event.shiftKey,
      well: well,
    };
    this.worker.postMessage({type: 'toggleWellSelection', payload});
  }

  /**
   * the two parameters from the plate component are received. The payload that is sent to the web worker
   * consists of two pieces:
   * 1. if the ctrl key was pressed
   * 2. the row index
   */
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
   * this method will be used to clear all the selections that are currently in the plate.
   * First, will send a message to the worker to let him know that a clearSelection action has been called,
   * so that the worker will reset its internal store (the selectedWellIds Set and the lastSelectedWell constant)
   * Secondly, will dispatch a clearSelection action to the store, so that it will clear the selectedWellId and
   * selectedRowKey data.
   */
  clearSelection(): void {
    this.worker.postMessage({type: 'clearSelection'});
    this.store.dispatch(clearSelection());
  }

  /**
   * it receives from the web worker the wellIds of the wells that have to be marked as selected.
   * First, it dispatches the wellIds received from the web worker to the store. Then,
   * it will generate the rowKeys based on the newly selected well ids and dispatch them to the store as well.
   */
  private updateSelectionModel(selectedWellIds: string[]): void {
    //this.store.dispatch(updateSelectedWellIds({selectedWellIds}));
    const selectedRowKeys = this.getRowKeysFromWellIds(selectedWellIds);
    /**
     * we dispatch this action also so that the appropriate traces in chart are highlighted based on the
     * well selected on the plate. (Also, without this method call, the selection of a well
     * won't be visible in the plate).
     */
    this.updateTableFromRowKeys(selectedRowKeys);
  }

  /* private updateSelectionFromTable(selectedWellIds: string[]): void {
     this.store.dispatch(updateSelectedWellIds({selectedWellIds}));
   }*/

  private updateTableFromRowKeys(selectedRowKeys: string[]): void {
    this.store.dispatch(updateSelectedRowKeys({selectedRowKeys}));
  }

  private getRowKeysFromWellIds(selectedWellIds: string[]): string[] {
    const selectedRowKeys: string[] = [];
    selectedWellIds.forEach((wellId) => {
      const sampleData = this.samples[wellId] || {};
      const targetNames = sampleData.targetNames || ['NoTarget'];
      targetNames.forEach((targetName: string) => {
        selectedRowKeys.push(`${wellId}_${targetName}`);
      });
    });
    return selectedRowKeys;
  }

  rowFromTables(selectedWellRows: WellTableRow[]) {
    this.worker.postMessage({type: "rowFromTables", payload: selectedWellRows})
  }

  /**
   * this method receives the traceName of the trace that the user has pressed and
   * sends it to the web worker as a payload.
   */
  tracesFromChart(traceName: string, selectedRowKeys: string[]): void {
    this.worker.postMessage({type: "tracesFromChart", payload: {traceName, selectedRowKeys}});
  }

}
