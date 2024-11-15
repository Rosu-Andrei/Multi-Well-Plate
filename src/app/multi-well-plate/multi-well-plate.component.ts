import {Component} from '@angular/core';
import {faBars, faFlask, faSearchMinus, faSearchPlus} from '@fortawesome/free-solid-svg-icons';
import {mockWells, Well} from "../model/well";
import {PlateService} from "../services/plate.service";
import {WellSelectionService} from "../services/well-selection.service";
import {load} from "@angular-devkit/build-angular/src/utils/server-rendering/esm-in-memory-loader/loader-hooks";

@Component({
  selector: 'app-multi-well-plate',
  templateUrl: './multi-well-plate.component.html',
  styleUrls: ['./multi-well-plate.component.css']
})
export class MultiWellPlateComponent {

  faFlask = faFlask;
  faSearchPlus = faSearchPlus;
  faSearchMinus = faSearchMinus;
  faBars = faBars;

  zoomLevel: number = 1; // Initial zoom level
  menuVisible: boolean = false; // Whether the side menu is visible or not
  activeTab: string = 'well-settings'; // Default active tab
  sampleId: string = ''; // Default sample ID
  sampleRole: string = 'Unknown Sample'; // Default sample role
  currentWell: Well | null = null; // Currently selected single well
  selectedWellsPositions: string = ''; // used for displaying multiple wells selected their ids

  baseCellSize: number = 30; // Base size for cells in pixels

  constructor(public plateService: PlateService,
              public selectionService: WellSelectionService) {

  }

  get cellSize(): number {
    return this.baseCellSize * this.zoomLevel;
  }

  selectPlate(plateSize: number | undefined): void {
    if (plateSize != 96 && plateSize != 384) {
      console.error('Unsupported plate size:', plateSize);
      return;
    }
    this.plateService.setupPlate(plateSize);
    this.selectionService.clearSelection();

  }


  load(): void {
    this.selectionService.selection.clear();
    mockWells.forEach(well => {
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
      this.selectionService.selection.select(this.plateService.getWells()[rowIndex][columnIndex]);
    });
  }


  toggleWellSelection(event: MouseEvent, well: Well): void {
    this.selectionService.toggleWellSelection(event, well);
    /**
     * called to update the current well position in the well settings tab
     */
    this.updateCurrentWellPosition();
    /**
     * called to update the current well sampleId and sampleRole in the well settings tab.
     */
    this.updateSampleInfo();
  }


  toggleRowSelection(event: MouseEvent, rowIndex: number): void {
    this.selectionService.toggleRowSelection(event, rowIndex);
    this.updateCurrentWellPosition();
    this.updateSampleInfo();
  }

  toggleColumnSelection(event: MouseEvent, columnIndex: number): void {
    this.selectionService.toggleColumnSelection(event, columnIndex);
    this.updateCurrentWellPosition();
    this.updateSampleInfo();
  }


  zoomIn(): void {
    if (this.zoomLevel < 3) { // Maximum zoom level set to 3x
      this.zoomLevel += 0.1;
      this.zoomLevel = Math.round(this.zoomLevel * 10) / 10; // Round to one decimal
    }
  }

  zoomOut(): void {
    if (this.zoomLevel > 0.5) { // Minimum zoom level set to 0.5x
      this.zoomLevel = Math.max(0.5, this.zoomLevel - 0.1);
      this.zoomLevel = Math.round(this.zoomLevel * 10) / 10; // Round to one decimal
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
    const selection = this.selectionService.selection;
    if (selection.selected.length == 1) {
      this.currentWell = selection.selected[0];
      this.selectedWellsPositions = this.currentWell.id;
    } else if (selection.selected.length > 1) {
      this.currentWell = null;
      this.selectedWellsPositions = selection.selected.map((well) => well.id).join(' ');
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
    const selection = this.selectionService.selection;
    if (this.currentWell) {
      this.sampleId = this.currentWell.sampleId || '';
      this.sampleRole = this.currentWell.sampleRole || 'Unknown Sample';
    } else {
      this.sampleId = '';
      this.sampleRole = 'Unknown Sample';
      selection.selected.forEach((well) => {
        if (well.sampleId) {
          this.sampleId += well.sampleId + ' ';
        }
      });
      if (this.sampleId == '') {
        this.sampleId = 'No sample ID has been entered';
      }
    }
  }

  /**
   * When the user enters a sampleId, this method will:
   * 1. update the component sampleId (because we want to show it updated in the browser)
   * 2. Each selected well will receive the sampleId entered. (if only one is selected,
   * the only one will receive it)
   */
  onSampleIdChange(newSampleId: string): void {
    this.sampleId = newSampleId;
    this.selectionService.selection.selected.forEach(well => {
      well.sampleId = newSampleId;
    });
  }

  /**
   * This method is very similar with the one above, the only difference being that
   * it is updating the Sample Role property.
   */
  onSampleRoleChange(newSampleRole: string): void {
    this.sampleRole = newSampleRole;
    this.selectionService.selection.selected.forEach(well => {
      well.sampleRole = newSampleRole;
    });
  }

  //protected readonly load = load;
}
