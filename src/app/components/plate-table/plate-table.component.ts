import {Component, OnInit, ViewChild} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState, WellSample} from '../../store/well.state';
import {updateWellSample, updateSelectedRowKeys} from '../../store/well.action';
import {PlateService} from '../../services/plate.service';
import {DxDataGridComponent} from 'devextreme-angular';
import {Well} from '../../model/well';
import {selectAllSamples, selectSelectedRowKeys} from "../../store/well.selectors";

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

  @ViewChild(DxDataGridComponent, {static: false}) dataGrid!: DxDataGridComponent; // instant of the grid
  wellsForTable: WellTableRow[] = []; // represents the data source for the grid.
  samples: Record<string, WellSample> = {}; // local representation of the samples from the store
  selectedRows: WellTableRow[] = []; // stores the currently selected rows
  private selectionFromOtherComponent: boolean = false;

  constructor(
    private plateService: PlateService,
    private store: Store<AppState>,
  ) {
  }

  /**
   * On the init hook we subscribe to the selectAllSamples part of the store, so that any update made to data such as
   * sampleId, sampleRole and targetNames will be synced with the table.
   *
   * In addition, we subscribe the table component to the selectedRowKeys part of the store also, so that any selection
   * done in any other component will be accordingly mirrored in the table.
   */
  ngOnInit(): void {
    this.store.select(selectAllSamples).subscribe((samples) => {
      this.samples = samples;
      this.initializeWellsForTable();
    });
    this.store.select(selectSelectedRowKeys).subscribe((selectedRowKeys) => {
      this.updateTableFromRowKeys(selectedRowKeys);
    });

    // Subscribe to selection changes
    /*   this.store.select(selectSelectedWellIds).subscribe((selectedWellIds) => {
         const selectedWells = this.wellsForTable.filter((row) =>
           selectedWellIds.includes(row.id)
         );
         this.updateTableSelection(selectedWells);
       });*/
  }

  /**
   * the following method is responsible to populate the wellsForTable array that acts as the data source for the
   * grid. It is called every time a change is made in the sample store (so that the table data is up-to-date)
   */
  initializeWellsForTable(): void {
    this.wellsForTable = []; // we clear the current data source.
    this.plateService.getFlatWells().forEach((well) => {
      const sampleData = this.samples[well.id] || {};
      const targetNames = sampleData.targetNames || [];

      /**
       * we create the rowKey for each targetName a well has and then push the data in the wellsForTable
       */
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

  /**
   * the below 2 attributes represent the cell values of the row and column in the grid.
   */
  rowIndex = (data: any) => data.row + 1;
  columnIndex = (data: any) => String.fromCharCode(data.column + 65);

  /**
   * this method is called whenever the user selects a row from the table. The event contains all the data of the selected row,
   * such as sampleRole, targetName, rowKey etc.
   */
  onSelectionChanged(event: any): void {
    if (this.selectionFromOtherComponent) {
      return;
    }

    this.selectedRows = event.selectedRowsData as WellTableRow[]; // store the current selected rows locally
    /**
     * from the current selected rows, we extract the rowKeys, and then we dispatch them to the store.
     * Since the changes are made in the store, any component subscribed to the store will receive the updates
     * from the table selection.
     */
    const selectedRowKeys = this.selectedRows.map((well) => well.rowKey);

    this.store.dispatch(updateSelectedRowKeys({selectedRowKeys}));
    /**
     * the issue was that based on the selectedRowKeys, we were extracting the selectedWellIds as well,
     * and dispatched them also for update. The problem was that In other parts of the application (e.g., for charting or well highlighting),
     * selectedRowKeys was recalculated based on selectedWellIds.
     * Since selectedWellIds only stored well IDs and not target names,
     * all row keys corresponding to a given well ID were re-selected, even if the user had only selected a specific row.
     */
  }

  /**
   * this method handles the editing of the sampleId, sampleRole and targetNames via the table.
   */
  onRowUpdating(event: any): void {
    const isMultipleSelection = this.selectedRows.length > 1;
    const changes: Partial<WellSample> = {};

    // we check if the modified row has a new sampleId
    if (event.newData.sampleId !== undefined) {
      changes.sampleId = event.newData.sampleId;
    }
    // we check if the modified row has a new sampleRole
    if (event.newData.sampleRole !== undefined) {
      changes.sampleRole = event.newData.sampleRole;
    }

    if (event.newData.targetName !== undefined) {
      const oldTargetName = event.oldData.targetName; // extract the targetName before the update
      const newTargetName = event.newData.targetName; //extract the targetName the user has entered

      /**
       * in the following 2 lines, the sample data for that wellId is extracted,
       * and we retrieve the array of targetNames it has.
       */
      const sampleData = this.samples[event.oldData.id] || {};
      let targetNames = sampleData.targetNames ? [...sampleData.targetNames] : [];
      /**
       * we get the position of the oldTargetName in the targetName array. If it exists, we replace
       * the oldTargetName with the newTargetName. If it doesn't exist, we simply add it.
       */
      const index = targetNames.indexOf(oldTargetName);
      if (index !== -1) {
        targetNames[index] = newTargetName;
      } else {
        targetNames.push(newTargetName);
      }

      changes.targetNames = targetNames.slice(0, 7);
    }
    /**
     * we dispatch the changes made by the user in the table to the store
     */
    if (isMultipleSelection) {
      this.selectedRows.forEach((wellData) => {
        let wellId = wellData.id;
        this.store.dispatch(updateWellSample({wellId, changes: changes}));
      });
    } else {
      const wellId = event.oldData.id;
      this.store.dispatch(updateWellSample({wellId, changes: changes}));
    }
  }

  /**
   * this method is called whenever another component makes changes to the store, to the selectedRowKeys
   * to be more precise. This method ensures that the table selects the rows accordingly to the
   * selection done in another component.
   */
  private updateTableFromRowKeys(selectedRowKeys: string[]): void {
    this.selectionFromOtherComponent = true;
    this.dataGrid.instance.clearSelection(); // clear current table selection
    // Select the corresponding rows
    this.dataGrid.instance.selectRows(selectedRowKeys, true).then(() => {
      this.selectionFromOtherComponent = false;
    });
  }
}
