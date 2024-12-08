import {Component, OnInit} from '@angular/core';
import {faBars, faFlask, faSearchMinus, faSearchPlus,} from '@fortawesome/free-solid-svg-icons';
import {mockWells, Well} from '../../model/well';
import {PlateService} from '../../services/plate.service';
import {WellSelectionService} from '../../services/well-selection.service';
import {Store} from '@ngrx/store';
import {WellSample, AppState} from '../../store/well.state';
import {updateWellSample, updateSelectedRowKeys, clearSelection} from '../../store/well.action';
import {ChartDataItem} from '../../model/chart';
import {selectAllSamples, selectSelectedRowKeys} from "../../store/well.selectors";

@Component({
  selector: 'app-multi-well-plate',
  templateUrl: './multi-well-plate.component.html',
  styleUrls: ['./multi-well-plate.component.css'],
})
export class MultiWellPlateComponent implements OnInit {
  faFlask = faFlask;
  faSearchPlus = faSearchPlus;
  faSearchMinus = faSearchMinus;
  faBars = faBars;

  zoomLevel: number = 1;
  menuVisible: boolean = false;
  activeTab: string = 'well-settings';
  sampleId: string = '';
  sampleRole: string = 'Unknown Sample';
  targetNames: string = '';
  currentWell: Well | null = null;
  selectedWellsPositions: string = '';

  baseCellSize: number = 30;
  samples: Record<string, WellSample> = {};

  isChartVisible: boolean = false;
  chartData: any[] = [];
  mockChartData: ChartDataItem[] = [];

  selectedWellIds: string[] = [];
  selectedRowKeys: string[] = [];

  constructor(
    public plateService: PlateService,
    public selectionService: WellSelectionService,
    private store: Store<AppState>
  ) {
  }


  ngOnInit(): void {


    this.store.select(selectSelectedRowKeys).subscribe((selectedRowKeys) => {
      this.selectedRowKeys = selectedRowKeys;
      const selectedWellIdsFromRowKeys = Array.from(
        new Set(selectedRowKeys.map((key) => key.split('_')[0]))
      );

      // Update selectedWellIds only if they have changed
      if (this.selectedWellIds.sort().join(',') !== selectedWellIdsFromRowKeys.sort().join(',')) {
        this.selectedWellIds = selectedWellIdsFromRowKeys;
        this.updateCurrentWellPosition();
        this.updateSampleInfo();
      }
    });

    this.store.select(selectAllSamples).subscribe((samples) => {
      this.samples = samples;
    })

  }

  get cellSize(): number {
    return this.baseCellSize * this.zoomLevel;
  }

  /**
   * This method is called the moment a user selects the plate size (96 or 384)
   */
  selectPlate(plateSize: number | undefined): void {
    if (plateSize !== 96 && plateSize !== 384) {
      console.error('Unsupported plate size:', plateSize);
      return;
    }
    /**
     * the plateService is going to create the appropriate well[] based on the size.
     * It will also create the headers for the rows and columns.
     */
    this.plateService.setupPlate(plateSize);
    /**
     * the moment a new size of plate is selected, the selectionService will:
     * 1. clear all the current selections
     * 2.
     */
    this.selectionService.clearSelection();
    this.selectionService.initializeWorker();
  }

  /**
   * the load function it is used to populate all the components with data already prepared. It
   */
  load(): void {
    this.selectionService.clearSelection();

    /**
     * from each mock well we extract its data. We then check if in the plate exists a well with the id of
     * the mock well, and if indeed exists, we dispatch to the store an update action for that well.
     * By dispatching an action to the store for each well, we make sure that the sampleData
     * will be also available and in sync in the table component.
     */
    mockWells.forEach((mockWell) => {
      const wellId = mockWell.id;
      const sampleId = mockWell.sampleId;
      const sampleRole = mockWell.sampleRole;
      const targetNames = mockWell.targetName
        ? mockWell.targetName.split(',').map((name) => name.trim()).slice(0, 7)
        : [];

      const well = this.plateService.getFlatWells().find(w => w.id === wellId);
      if (well) {
        this.store.dispatch(
          updateWellSample({
            wellId: well.id,
            changes: {
              sampleId: sampleId,
              sampleRole: sampleRole,
              targetNames: targetNames,
            },
          })
        );
      } else {
        console.error(`Well ID ${wellId} not found on the current plate.`);
      }
    });

    this.generateMockChartData();
    this.prepareChartData();
  }

  /**
   * When the user selects a well in the plate, it will trigger this method to be called.
   * The method receives 2 parameters, first the event that can contain data such as
   * (if ctrl or shift was pressed when the well was clicked) and the second will be the
   * Well object itself, for example :
   * {id: 'A1', row: 0, column: 0, sampleRole: 'Negative Process Control', sampleId: '12', targetNames: ['Target5', 'Target4'] }
   * The component will call the selectionService method with the same name.
   */
  toggleWellSelection(event: MouseEvent, well: Well): void {
    this.selectionService.toggleWellSelection(event, well);
  }

  /**
   * The method captures the mouse click event and the index of the row that was clicked
   * (for row header = 1, the index is 0 in the well [][])
   */
  toggleRowSelection(event: MouseEvent, rowIndex: number): void {
    this.selectionService.toggleRowSelection(event, rowIndex);
  }

  toggleColumnSelection(event: MouseEvent, columnIndex: number): void {
    this.selectionService.toggleColumnSelection(event, columnIndex);
  }

  zoomIn(): void {
    if (this.zoomLevel < 3) {
      this.zoomLevel += 0.1;
      this.zoomLevel = Math.round(this.zoomLevel * 10) / 10;
    }
  }

  zoomOut(): void {
    if (this.zoomLevel > 0.5) {
      this.zoomLevel = Math.max(0.5, this.zoomLevel - 0.1);
      this.zoomLevel = Math.round(this.zoomLevel * 10) / 10;
    }
  }

  toggleMenu(): void {
    this.menuVisible = !this.menuVisible;
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  /**
   * this method checks whether a well has its id in the selectedWellIds.
   * If it has, it means that is selected and will be marked as such in the plate.
   */
  isSelected(well: Well): boolean {
    return this.selectedWellIds.includes(well.id);
  }

  /**
   * this method is used to display the wellIds of the wells that are currently selected
   * in the well settings tab.
   */
  updateCurrentWellPosition(): void {
    const selectedWells = this.plateService
      .getFlatWells()
      .filter((well) => this.selectedWellIds.includes(well.id));

    if (selectedWells.length === 1) {
      this.currentWell = selectedWells[0];
      this.selectedWellsPositions = this.currentWell.id;
    } else if (selectedWells.length > 1) {
      this.currentWell = null;
      this.selectedWellsPositions = selectedWells.map((well) => well.id).join(' ');
    } else {
      this.currentWell = null;
      this.selectedWellsPositions = '';
    }
  }

  /**
   * this method is responsible to update the sampleId, sampleRole and targetName fields
   * in the well settings tab.
   */
  updateSampleInfo(): void {
    const selectedWells = this.plateService
      .getFlatWells()
      .filter((well) => this.selectedWellIds.includes(well.id));
    /**
     * if the currentWell is not null, it means that only one well is selected,
     * and we update the fields with its data.
     */
    if (this.currentWell) {
      const sampleData = this.samples[this.currentWell.id] || {};
      this.sampleId = sampleData.sampleId || '';
      this.sampleRole = sampleData.sampleRole || 'Unknown Sample';
      this.targetNames = (sampleData.targetNames || []).join(', ');
    } else {
      this.sampleId = '';
      this.sampleRole = 'Unknown Sample';
      this.targetNames = '';
      selectedWells.forEach((well) => {
        const sampleData = this.samples[well.id] || {};
        if (sampleData.sampleId) {
          this.sampleId += sampleData.sampleId + ' ';
        }
      });
      if (this.sampleId.trim() === '') {
        this.sampleId = 'No sample ID has been entered';
      }
    }
  }

  /**
   * in the well settings tab, when the user updates the sampleId for one or more wells,
   * this method will be called.
   */
  onSampleIdChange(newSampleId: string): void {
    this.sampleId = newSampleId; // used in the html, 2 way binding
    /**
     * for each well that is currently selected, we dispatch to the store the new sampleId.
     * Because we dispatch to the store the change, the new sampleId value will be visible also
     * in the other components.
     */
    this.selectedWellIds.forEach((wellId) => {
      this.store.dispatch(updateWellSample({wellId, changes: {sampleId: newSampleId}}));
    });
  }

  /**
   * updates the store with the newly selected sampleRoles.
   */
  onSampleRoleChange(newSampleRole: string): void {
    this.sampleRole = newSampleRole; // used in the html for updating the value in the well settings view.
    /**
     * for each well that is selected, we updated the sampleRole with the value selected by the user.
     */
    this.selectedWellIds.forEach((wellId) => {
      this.store.dispatch(updateWellSample({wellId, changes: {sampleRole: newSampleRole}}));
    });
  }

  /**
   * similar to the other 2 methods. We create an array with the targetNames entered by the user, and we update
   * all the selected wells with those targetNames. (by dispatching the array of targetNames to the store)
   */
  onTargetNameChange(newTargetNames: string): void {
    this.targetNames = newTargetNames; // we extract the newly entered targetNames for html update
    const targetNamesArray = newTargetNames.split(',').map((name) => name.trim()).slice(0, 7);
    this.selectedWellIds.forEach((wellId) => {
      this.store.dispatch(updateWellSample({wellId, changes: {targetNames: targetNamesArray}}));
    });
  }

  /**
   * this method is called when the load() takes place. It prepares the ChartData from the mockWell
   * that will eventually be passed to the chart component.
   */
  generateMockChartData(): void {
    this.mockChartData = []; // represents the data that a trace contains (wellId, targetNames, x and y coordinates)

    mockWells.forEach((well) => {
      const wellId = well.id;
      const targetNames = well.targetName
        ? well.targetName.split(',').map(name => name.trim())
        : [];
      /**
       * for each targetName that a well has, we calculate different x and y values.
       */
      targetNames.forEach((targetName) => {
        const x = Array.from({length: 45}, (_, i) => i + 1);
        const y = x.map(() => Math.random() / 10);

        this.mockChartData.push({
          wellId: wellId,
          targetName: targetName,
          x: x,
          y: y,
        });
      });
    });
  }

  /**
   * this method will generate the chart data based on the ChartData array that was created on the loading.
   * Since the chartData[] is an @Input element of chart component, the chart will receive all the data.
   */
  prepareChartData(): void {
    this.chartData = [];
    this.mockChartData.forEach((dataItem) => {
      const trace = {
        x: dataItem.x,
        y: dataItem.y,
        type: 'scattergl',
        mode: 'lines',
        name: `${dataItem.wellId}_${dataItem.targetName}`,
        hovertemplate: `<i>Well ID: ${dataItem.wellId}, Target Name: ${dataItem.targetName}</i><br>X: %{x}<br>Y: %{y}<extra></extra>`,
        line: {
          width: 2,
          opacity: 1,
        },
      };
      this.chartData.push(trace);
    });
  }

  onWellSelected(rowKey: string): void {
    if (rowKey === 'clearSelection') {
      this.store.dispatch(clearSelection());
    } else {
      this.store.dispatch(updateSelectedRowKeys({selectedRowKeys: [rowKey]}));
    }
  }

  toggleChart(): void {
    this.isChartVisible = !this.isChartVisible;
  }
}
