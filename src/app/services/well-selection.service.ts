// well-selection.service.ts

import {Injectable} from '@angular/core';
import {PlateService} from './plate.service';
import {Well} from '../model/well';
import {Store} from '@ngrx/store';
import {AppState, WellSample} from '../store/well.state';
import {updateSelectedWellIds, updateSelectedRowKeys, clearSelection} from '../store/well.action';
import {selectAllSamples} from "../store/well.selectors";

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

      this.worker.onmessage = ({data}) => {
        const message = data;

        if (message.type === 'selectionUpdate') {
          this.updateSelectionModel(message.payload);
        } else if (message.type === 'selectionUpdateFromTable') {
          this.updateSelectionFromTable(message.payload);
        } else if (message.type === 'rowKeyUpdate') {
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

  initializeWorker(): void {
    this.worker.postMessage({
      type: 'initialize',
      payload: {wells: this.plateService.getWells()},
    });
  }

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

  clearSelection(): void {
    this.worker.postMessage({type: 'clearSelection'});
    this.store.dispatch(clearSelection());
  }

  private updateSelectionModel(selectedWellIds: string[]): void {
    this.store.dispatch(updateSelectedWellIds({selectedWellIds}));
    // Do not dispatch updateSelectedRowKeys here
    const selectedRowKeys = this.getRowKeysFromWellIds(selectedWellIds);
    this.store.dispatch(updateSelectedRowKeys({selectedRowKeys}));
  }

  private updateSelectionFromTable(selectedWellIds: string[]): void {
    this.store.dispatch(updateSelectedWellIds({selectedWellIds}));
  }

  private updateTableFromRowKeys(selectedRowKeys: string[]): void {
    this.store.dispatch(updateSelectedRowKeys({selectedRowKeys}));
  }

  private getRowKeysFromWellIds(wellIds: string[]): string[] {
    const selectedRowKeys: string[] = [];
    wellIds.forEach((wellId) => {
      const sampleData = this.samples[wellId] || {};
      const targetNames = sampleData.targetNames || ['NoTarget'];
      targetNames.forEach((targetName: string) => {
        selectedRowKeys.push(`${wellId}_${targetName}`);
      });
    });
    return selectedRowKeys;
  }
}
