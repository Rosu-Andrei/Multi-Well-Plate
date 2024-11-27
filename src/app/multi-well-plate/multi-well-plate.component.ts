import {Component, OnInit} from '@angular/core';
import {
  faBars,
  faFlask,
  faSearchMinus,
  faSearchPlus,
} from '@fortawesome/free-solid-svg-icons';
import {mockWells, Well} from '../model/well';
import {PlateService} from '../services/plate.service';
import {WellSelectionService} from '../services/well-selection.service';
import {Store} from "@ngrx/store";
import {WellSample, WellSamplesState} from "../store/well.state";
import {selectAllSamples} from "../store/well.selectors";
import {updateWellSample} from "../store/well.action";

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

  load(): void {
    this.selectionService.clearSelection();
    mockWells.forEach((well) => {
      const columnChar = well.id.charAt(0);
      const rowStr = well.id.slice(1);

      if (!columnChar || !rowStr) {
        console.error(`Invalid well ID: ${well.id}`);
        return;
      }

      const columnIndex = columnChar.charCodeAt(0) - 65;
      const rowIndex = parseInt(rowStr, 10) - 1;

      if (
        rowIndex < 0 ||
        rowIndex >= this.plateService.rows ||
        columnIndex < 0 ||
        columnIndex >= this.plateService.columns
      ) {
        console.error(
          `Well ID ${well.id} is out of bounds for the current plate size (${this.plateService.rows} rows x ${this.plateService.columns} columns).`
        );
        return;
      }
      const selectedWell = this.plateService.getWells()[rowIndex][columnIndex];
      // Simulate a selection event
      const event = {
        ctrlKey: true,
        metaKey: true,
        shiftKey: false,
      } as MouseEvent;
      this.selectionService.toggleWellSelection(event, selectedWell);
    });
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
}
