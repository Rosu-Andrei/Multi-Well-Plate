import {Component, OnInit} from '@angular/core';
import {faBars, faFlask, faSearchMinus, faSearchPlus,} from '@fortawesome/free-solid-svg-icons';
import {mockWells, Well} from '../../model/well';
import {PlateService} from '../../services/plate.service';
import {WellSelectionService} from '../../services/well-selection.service';
import {Store} from "@ngrx/store";
import {WellSample, WellSamplesState} from "../../store/well.state";
import {selectAllSamples} from "../../store/well.selectors";
import {updateWellSample} from "../../store/well.action";
import {ChartDataItem} from "../../model/chart";

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

  zoomLevel: number = 1; // Initial zoom level
  menuVisible: boolean = false; // Whether the side menu is visible or not
  activeTab: string = 'well-settings'; // Default active tab
  sampleId: string = ''; // Default sample ID
  sampleRole: string = 'Unknown Sample'; // Default sample role
  targetNames: string = ''; // This variable stores all the targetNames of a well separated by comma.
  currentWell: Well | null = null; // Currently selected single well
  selectedWellsPositions: string = ''; // IDs of selected wells

  baseCellSize: number = 30; // Base size for cells in pixels
  samples: Record<string, WellSample> = {};

  isChartVisible: boolean = false;
  chartData: any[] = []; // Holds the data to be passed to PlotlyChartComponent
  mockChartData: ChartDataItem[] = []; // Now generated dynamically
  selectedWellIds: string[] = [];

  toggleChart(): void {
    this.isChartVisible = !this.isChartVisible;
  }

  constructor(
    public plateService: PlateService,
    public selectionService: WellSelectionService,
    private store: Store<WellSamplesState>
  ) {
  }

  ngOnInit(): void {
    /**
     * we subscribe to the Subject so that we receive the data that it emits.
     */
    this.selectionService.selectionChangeSubject.subscribe(
      (selectedWells: Well[]) => {
        this.updateCurrentWellPosition();
        this.updateSampleInfo();
      }
    );

    this.selectionService.selectedWellIdsSubject.subscribe((wellIds) => {
      this.selectedWellIds = wellIds;
    })
    /**
     * when the page it is initiated, we get all the initial well states form the store. Also, we subscribe to the store so that
     * any change made (the user has added a sampleId for example) will be intercepted. With this, a sync is maintained between
     * the plate and the well settings tab.
     */
    this.store.select(selectAllSamples).subscribe((samples) => {
      this.samples = samples;
    });
  }

  get cellSize(): number {
    return this.baseCellSize * this.zoomLevel;
  }

  selectPlate(plateSize: number | undefined): void {
    if (plateSize !== 96 && plateSize !== 384) {
      console.error('Unsupported plate size:', plateSize);
      return;
    }
    this.plateService.setupPlate(plateSize);
    this.selectionService.clearSelection();
    this.selectionService.initializeWorker();
  }

  /**
   * this functions extracts well data from an array with the values already predefined. Each well inside the array
   * has its data synchronised with the well plate, well settings and table view. Also, it sends back an array of
   * ChartDataItem to the chart-component for the rendering of the plot.
   */
  load(): void {
    this.selectionService.clearSelection();

    mockWells.forEach((mockWell) => {

      /**
       * for each well from the mockArray, we extract the data a well contains.
       */
      const wellId = mockWell.id;
      const sampleId = mockWell.sampleId;
      const sampleRole = mockWell.sampleRole;
      const targetNames = mockWell.targetName ? mockWell.targetName.split(',').map(name => name.trim()).slice(0, 7) : [];

      const well = this.plateService.getFlatWells().find(w => w.id === wellId);
      /**
       * if the well is undefined, it means that the wellID we used for the finding doesn't exist on the current plate.
       */
      if (well) {
        this.store.dispatch(updateWellSample({
          wellId: well.id,
          changes: {
            sampleId: sampleId,
            sampleRole: sampleRole,
            targetNames: targetNames
          }
        }));

      } else {
        console.error(`Well ID ${wellId} not found on the current plate.`);
      }
    });

    this.generateMockChartData();
    this.prepareChartData();
  }

  toggleWellSelection(event: MouseEvent, well: Well): void {
    this.selectionService.toggleWellSelection(event, well);
  }

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
   * this method determines if only a single well has been selected. If it is so,
   * then the current well will point to this well. If multiple wells are selected or none, then
   * the current well will receive the null value.
   *
   * This method is essential in showing the current selected well position in the readOnly box
   */
  updateCurrentWellPosition(): void {
    const currentSelection = this.selectionService.selection;
    if (currentSelection.selected.length === 1) {
      this.currentWell = currentSelection.selected[0];
      this.selectedWellsPositions = this.currentWell.id;
    } else if (currentSelection.selected.length > 1) {
      this.currentWell = null;
      this.selectedWellsPositions = currentSelection.selected.map((well) => well.id).join(' ');
    } else {
      this.currentWell = null;
      this.selectedWellsPositions = '';
    }
  }

  /**
   * This method is very similar in what it does with the one above. The difference is that,
   * it displays the sampleID and sampleRole that a selected well has.
   *
   * If multiple wells are selected, the window will display "" as the id and Unknown Value as the sample role.
   */
  updateSampleInfo(): void {
    const array = this.selectionService.selection.selected;
    if (this.currentWell) {
      const sampleData = this.samples[this.currentWell.id] || {}; // get the current data of the well using the store
      this.sampleId = sampleData.sampleId || '';
      this.sampleRole = sampleData.sampleRole || 'Unknown Sample';
      this.targetNames = (sampleData.targetNames || []).join(', ');
    } else {
      this.sampleId = '';
      this.sampleRole = 'Unknown Sample';
      this.targetNames = '';
      array.forEach((well) => {
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
   * When the user enters a sampleId, this method will:
   * 1. update the component sampleId (because we want to show it updated in the browser)
   * 2. We dispatch a new action to the state storage to update for each selected well with the newly added data.
   */
  onSampleIdChange(newSampleId: string): void {
    this.sampleId = newSampleId;
    this.selectionService.selection.selected.forEach((well) => {
      this.store.dispatch(updateWellSample({wellId: well.id, changes: {sampleId: newSampleId}}))
    });
  }

  /**
   * This method is very similar with the one above, the only difference being that
   * it is updating the Sample Role property.
   */
  onSampleRoleChange(newSampleRole: string): void {
    this.sampleRole = newSampleRole;
    this.selectionService.selection.selected.forEach((well) => {
      this.store.dispatch(updateWellSample({wellId: well.id, changes: {sampleRole: newSampleRole}}))
    });
  }

  /**
   * When the user parses one or multiple targetNames with comma in the well-settings tab,
   * this method will take those new values and will put them all in an array.
   * The array then is sent to the state store for update.
   */
  onTargetNameChange(newTargetNames: string) {
    this.targetNames = newTargetNames;
    const targetNamesArray = newTargetNames.split(',').map(name => name.trim()).slice(0, 7);
    this.selectionService.selection.selected.forEach((well) => {
      this.store.dispatch(updateWellSample({wellId: well.id, changes: {targetNames: targetNamesArray}}))
    });
  }

  /**
   * this method is responsible for creating the mockData for the chart based on the mockData for the plate.
   * It randomly generates the y value, whereas the x vale is a sequence from 1 to 46.
   */
  generateMockChartData(): void {
    this.mockChartData = [];

    mockWells.forEach((well) => {
      const wellId = well.id;
      const targetNames = well.targetName ? well.targetName.split(',').map(name => name.trim()) : [];

      targetNames.forEach((targetName) => {
        const x = Array.from({length: 45}, (_, i) => i + 1);
        const y = x.map(() => (Math.random() / 10)); // Generate random y values for demonstration

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
   * Based on the mockData for the chart, it will create the charData array that will then be sent to the
   * chart-component which will use it to render the plot.
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
          }
        }
      ;
      this.chartData.push(trace);
    });
  }

  onWellSelected(wellId: string): void {
    this.selectionService.selectWellById(wellId);
  }
}
