import {Component, OnInit, ViewChild} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState, WellSample} from '../../store/well.state';
import {updateWellSample, updateSelectedRowKeys} from '../../store/well.action';
import {PlateService} from '../../services/plate.service';
import {WellSelectionService} from '../../services/well-selection.service';
import {DxDataGridComponent} from 'devextreme-angular';
import {Well} from '../../model/well';
import {selectAllSamples, selectSelectedRowKeys, selectSelectedWellIds} from "../../store/well.selectors";

/**
 * the following interfaces it is used to represent the data of a row in the table.
 * Apart from the usual data that a well has, it contains also a rowKey that acts as a unique id
 * for each row of the table.
 */
interface WellTableRow extends Well {
  rowKey: string;
}

@Component({
  selector: 'app-plate-table',
  templateUrl: './plate-table.component.html',
  styleUrls: ['./plate-table.component.css'],
})
export class PlateTableComponent implements OnInit {

  @ViewChild(DxDataGridComponent, {static: false}) dataGrid!: DxDataGridComponent;
  wellsForTable: WellTableRow[] = [];
  samples: Record<string, WellSample> = {};
  selectedWells: WellTableRow[] = [];
  private isSelectionUpdatingFromPlate: boolean = false;

  constructor(
    private plateService: PlateService,
    private store: Store<AppState>,
  ) {
  }

  ngOnInit(): void {
    // Subscribe to samples
    this.store.select(selectAllSamples).subscribe((samples) => {
      this.samples = samples;
      this.initializeWellsForTable();
    });

    // Subscribe to selection changes
    this.store.select(selectSelectedWellIds).subscribe((selectedWellIds) => {
      const selectedWells = this.wellsForTable.filter((row) =>
        selectedWellIds.includes(row.id)
      );
      this.updateTableSelection(selectedWells);
    });

    // Subscribe to row key selection changes
    this.store.select(selectSelectedRowKeys).subscribe((selectedRowKeys) => {
      this.updateTableFromRowKeys(selectedRowKeys);
    });
  }

  initializeWellsForTable(): void {
    this.wellsForTable = [];

    this.plateService.getFlatWells().forEach((well) => {
      const sampleData = this.samples[well.id] || {};
      const targetNames = sampleData.targetNames || [];

      if (targetNames.length > 0) {
        targetNames.forEach((targetName) => {
          const rowKey = `${well.id}_${targetName}`;
          this.wellsForTable.push({
            ...well,
            sampleId: sampleData.sampleId,
            sampleRole: sampleData.sampleRole,
            targetName: targetName,
            rowKey: rowKey,
          });
        });
      } else {
        const rowKey = `${well.id}_NoTarget`;
        this.wellsForTable.push({
          ...well,
          sampleId: sampleData.sampleId,
          sampleRole: sampleData.sampleRole,
          targetName: '',
          rowKey: rowKey,
        });
      }
    });
  }

  rowIndex = (data: any) => data.row + 1;
  columnIndex = (data: any) => String.fromCharCode(data.column + 65);

  updateTableSelection(selectedWells: WellTableRow[]): void {
    this.isSelectionUpdatingFromPlate = true;
    const keysToSelect = selectedWells.map((row) => row.rowKey);

    this.dataGrid.instance.clearSelection();
    this.dataGrid.instance.selectRows(keysToSelect, true).then(() => {
      this.isSelectionUpdatingFromPlate = false;
    });
  }

  /**
   * this method is called whenever the user selects a row from the table. The event contains all the data of the selected row,
   * such as sampleRole, targetName, rowKey etc.
   */
  onSelectionChanged(event: any): void {
    if (this.isSelectionUpdatingFromPlate) {
      return;
    }

    this.selectedWells = event.selectedRowsData as WellTableRow[]; // store the current selected rows
    /**
     * from the current selected rows, we extract the rowKeys
     */
    const selectedRowKeys = this.selectedWells.map((well) => well.rowKey);

    this.store.dispatch(updateSelectedRowKeys({selectedRowKeys}));
    /**
     * the issue was that based on the selectedRowKeys, we were extracting the selectedWellIds as well,
     * and dispatched them also for update. The problem was that In other parts of the application (e.g., for charting or well highlighting),
     * selectedRowKeys was recalculated based on selectedWellIds.
     * Since selectedWellIds only stored well IDs and not target names,
     * all row keys corresponding to a given well ID were re-selected, even if the user had only selected a specific row.
     */
  }

  onRowUpdating(event: any): void {
    const isMultipleSelection = this.selectedWells.length > 1;
    const changes: Partial<WellSample> = {};

    if (event.newData.sampleId !== undefined) {
      changes.sampleId = event.newData.sampleId;
    }

    if (event.newData.sampleRole !== undefined) {
      changes.sampleRole = event.newData.sampleRole;
    }

    if (event.newData.targetName !== undefined) {
      const oldTargetName = event.oldData.targetName;
      const newTargetName = event.newData.targetName;

      const sampleData = this.samples[event.oldData.id] || {};
      let targetNames = sampleData.targetNames ? [...sampleData.targetNames] : [];

      const index = targetNames.indexOf(oldTargetName);
      if (index !== -1) {
        targetNames[index] = newTargetName;
      } else {
        targetNames.push(newTargetName);
      }

      changes.targetNames = targetNames.slice(0, 7);
    }

    if (isMultipleSelection) {
      this.selectedWells.forEach((wellData) => {
        let wellId = wellData.id;
        this.store.dispatch(updateWellSample({wellId, changes: changes}));
      });
    } else {
      const wellId = event.oldData.id;
      this.store.dispatch(updateWellSample({wellId, changes: changes}));
    }
  }

  private updateTableFromRowKeys(selectedRowKeys: string[]): void {
    this.isSelectionUpdatingFromPlate = true;

    // Clear current selection
    this.dataGrid.instance.clearSelection();

    // Select the corresponding rows
    this.dataGrid.instance.selectRows(selectedRowKeys, true).then(() => {
      this.isSelectionUpdatingFromPlate = false;
    });
  }
}
