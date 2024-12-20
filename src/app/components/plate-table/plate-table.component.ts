import {Component, OnInit, ViewChild} from '@angular/core';
import {Store} from '@ngrx/store';
import {Well} from '../../model/well';
import {PlateService} from '../../services/plate.service';
import {WellSample, WellSamplesState} from '../../store/well.state';
import {WellSelectionService} from '../../services/well-selection.service';
import {DxDataGridComponent} from 'devextreme-angular';
import {updateWellSample} from "../../store/well.action";
import {selectAllSamples} from "../../store/well.selectors";


/**
 * this interface is based on the Well but for the table we add another propriety called 'rowKey', that is used to uniquely identified
 * each well in the table.
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
    private store: Store<WellSamplesState>,
    private selectionService: WellSelectionService
  ) {
  }

  /**
   * we update the wellsForTable[] provided by the plate service every time using the store subscription. We do this because the well[]
   * represents the data set for the table.
   */
  ngOnInit(): void {
    this.store.select(selectAllSamples).subscribe((samples) => {
      this.samples = samples;
      this.initializeWellsForTable();
    });

    /**
     * Using the selection service that provides to us the Observable that communicates with the web worker,
     * we subscribe to it so that the wells that have been selected using the plate are transferred
     * to the table also so that they're corresponding rows are selected in the table.
     */
    this.selectionService.selectionChangeSubject.subscribe(
      (selectedWells: Well[]) => {
        this.updateTableSelection(selectedWells);
      }
    );
    this.selectionService.tableRowSelectionSubject.subscribe((rowKey: string) => {
      this.updateTableFromChart(rowKey);
    });
  }


  /**
   * this method is used to populate the wellsForTable[] that is going to be used as a datasource for the grid.
   *
   */
  initializeWellsForTable(): void {
    this.wellsForTable = [];

    this.plateService.getFlatWells().forEach((well) => {
      const sampleData = this.samples[well.id] || {};
      const targetNames = sampleData.targetNames || [];

      if (targetNames.length > 0) {
        targetNames.forEach((targetName) => {
          const rowKey = `${well.id}_${targetName}`; // we create the unique key for each row.
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
   * these two indexes are used for the display of the row and column identical with that of the plate.
   */
  rowIndex = (data: any) => data.row + 1;
  columnIndex = (data: any) => String.fromCharCode(data.column + 65);

  /**
   * This method receives the array that contains the wells that have been selected in the plate by the user. Using them,
   * we select the corresponding rows in the table.
   */
  updateTableSelection(selectedWells: Well[]): void {
    this.isSelectionUpdatingFromPlate = true;

    const selectedWellIds = selectedWells.map((well) => well.id);
    const keysToSelect = this.wellsForTable
      .filter((row) => selectedWellIds.includes(row.id))
      .map((row) => row.rowKey);

    /**
     * clear current selection.
     */
    this.dataGrid.instance.clearSelection();

    // Select the corresponding rows
    this.dataGrid.instance.selectRows(keysToSelect, true).then(() => {
      this.isSelectionUpdatingFromPlate = false;
    });
  }

  /**
   * this method is used to get the current rows selected at a given time.
   */
  onSelectionChanged(event: any): void {
    if (this.isSelectionUpdatingFromPlate) {
      return;
    }

    this.selectedWells = event.selectedRowsData as WellTableRow[];

    const selectedWellIds = this.selectedWells.map((well) => well.id);
    this.updatePlateSelection(selectedWellIds);

    // Emit the selected row keys to the WellSelectionService
    const selectedRowKeys = this.selectedWells.map((well) => well.rowKey);
    this.selectionService.tableSelectionSubject.next(selectedRowKeys);
  }

  /**
   * this method is going to send to the wellSelectService the wells that have been selected using the table.
   */
  updatePlateSelection(wellIds: string[]): void {
    const selectedWells = this.plateService
      .getFlatWells()
      .filter((well) => wellIds.includes(well.id)); // filter the plate wells
    this.selectionService.selectionFromTable(selectedWells);
  }

  /**
   * every time a table cell receives an update on either sampleID or sampleRole,
   * a new action is triggered that will update the state store.
   */
  onRowUpdating(event: any): void {
    const isMultipleSelection = this.selectedWells.length > 1;
    const changes: Partial<WellSample> = {};
    const wellId = event.oldData.id;

    if (event.newData.sampleId !== undefined) {
      changes.sampleId = event.newData.sampleId;
    }

    if (event.newData.sampleRole !== undefined) {
      changes.sampleRole = event.newData.sampleRole;
    }

    if (event.newData.targetName !== undefined) {
      const oldTargetName = event.oldData.targetName;
      const newTargetName = event.newData.targetName;

      const sampleData = this.samples[wellId] || {};
      let targetNames = sampleData.targetNames ? [...sampleData.targetNames] : [];

      // Replace the old target name with the new one
      const index = targetNames.indexOf(oldTargetName);
      if (index !== -1) {
        targetNames[index] = newTargetName;
      } else {
        targetNames.push(newTargetName);
      }

      changes.targetNames = targetNames.slice(0, 7); // Limit to 7
    }
    /**
     * if multiple rows are selected, then each of the rows will get the newly sampleID and / or sampleRole
     */
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

  updateTableFromChart(rowKey: string) {
    this.isSelectionUpdatingFromPlate = true;

    this.dataGrid.instance.clearSelection();

    // Find the row corresponding to the rowKey and select it
    this.dataGrid.instance.selectRows([rowKey], true).then(() => {
      // Reset the selection update flag
      this.isSelectionUpdatingFromPlate = false;
    });
  }

}
