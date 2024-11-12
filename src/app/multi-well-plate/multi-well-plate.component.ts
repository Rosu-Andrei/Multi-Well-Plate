import {Component} from '@angular/core';
import {SelectionModel} from '@angular/cdk/collections';
import {faBars, faFlask, faSearchMinus, faSearchPlus} from '@fortawesome/free-solid-svg-icons';

interface Well {
  id: string;
  row?: number;
  column?: number;
  sampleRole?: string;
  sampleId?: string;
}

@Component({
  selector: 'app-multi-well-plate',
  templateUrl: './multi-well-plate.component.html',
  styleUrls: ['./multi-well-plate.component.css']
})
export class MultiWellPlateComponent {
  numberOfWells: number | undefined;
  rows: number = 0;
  columns: number = 0;
  rowHeaders: string[] = [];
  columnHeaders: string[] = [];
  wells: Well[][] = [];
  zoomLevel: number = 1; // Initial zoom level
  selection = new SelectionModel<Well>(true, []);

  mockWells: Well[] = [
    {id: 'F5'},
    {id: 'A1'},
    {id: 'X16'}
  ];
  faFlask = faFlask;
  faSearchPlus = faSearchPlus;
  faSearchMinus = faSearchMinus;
  faBars = faBars;

  menuVisible: boolean = false; // Whether the side menu is visible or not
  activeTab: string = 'well-settings'; // Default active tab
  sampleId: string = ''; // Default sample ID
  sampleRole: string = 'Unknown Sample'; // Default sample role
  currentWell: Well | null = null; // Currently selected single well
  selectedWellsPositions: string = ''; // used for displaying multiple wells selected their ids


  selectPlate(plateSize: number | undefined): void {
    if (plateSize != 96 && plateSize != 384) {
      console.error('Unsupported plate size:', plateSize);
      return;
    }
    this.numberOfWells = plateSize;
    this.setupPlate();
  }

  setupPlate(): void {
    if (this.numberOfWells == 96) {
      this.rows = 8;
      this.columns = 12;
    } else if (this.numberOfWells == 384) {
      this.rows = 16;
      this.columns = 24;
    }

    this.rowHeaders = [];
    this.columnHeaders = [];
    this.wells = [];

    for (let i = 0; i < this.rows; i++) {
      // Assuming row headers are letters (A, B, C, ...)
      this.rowHeaders.push(`${i + 1}`);
    }

    this.columnHeaders = Array.from({length: this.columns}, (_, i) => {
      let letters = '';
      let num = i;
      while (num >= 0) {
        letters = String.fromCharCode(65 + (num % 26)) + letters;
        num = Math.floor(num / 26) - 1;
      }
      return letters;
    });

    for (let row = 0; row < this.rows; row++) {
      const wellRow: Well[] = [];
      for (let column = 0; column < this.columns; column++) {
        const id = `${this.columnHeaders[column]}${this.rowHeaders[row]}`;
        const well: Well = {id, row, column};
        wellRow.push(well);
      }
      this.wells.push(wellRow);
    }
  }

  /**
   * The purpose of this property is to keep track of the last well that was selected before
   * using the ctrl + shift combination. It represents the starting point
   */
  lastSelectedWell: Well | null = null;

  toggleWellSelection(event: MouseEvent, well: Well): void {
    const ctrlPressed = event.ctrlKey || event.metaKey;
    const shiftPressed = event.shiftKey;
    /**
     * We verify that both ctrl and shift are pressed, and also if the lastSelectedWell has been
     * selected, so we have a starting point.
     */
    if (ctrlPressed && shiftPressed && this.lastSelectedWell) {
      /**
       * we retrieve all the wells in the range defined by the ctrl + shift.
       * After that, all the wells in that array are put in the selection.select array,
       * thus making them selected.
       */
      const newSelection = this.getWellsInRange(this.lastSelectedWell, well);
      this.selection.select(...newSelection);
      /**
       * If only ctrl is pressed, then we are in the scenario where we select multiple
       * wells that can be anywhere on the plate.
       */
    } else if (ctrlPressed) {
      this.selection.toggle(well);
      /**
       * here we also update the lastSelectedWell just in case we then want to use
       * the shift functionality.
       */
      this.lastSelectedWell = well;
      /**
       * Here we are if no key on the keyboard has been pressed. It means
       * that we are selecting only a single well.
       */
    } else {
      this.selection.clear();
      this.selection.select(well);
      this.lastSelectedWell = well;
    }
    /**
     * called to update the current well position in the well settings tab
     */
    this.updateCurrentWellPosition();
    /**
     * called to update the current well sampleId and sampleRole in the well settings tab.
     */
    this.updateSampleInfo();
  }

  /**
   * This is the method that calculates and returns them as an array, all the wells
   * that are going to be selected when using ctrl + shift.
   *
   * the startWell is going to be always lastSelectionWell
   * the endWell is the well parameter of the toggleWellSelection method.
   * (the well that the user clicks while holding ctrl + shift/0
   */
  getWellsInRange(startWell: Well, endWell: Well): Well[] {
    /**
     * first, we extract the row and column coordinates of both the start and the last well.
     * The "!" used tells typescript that all of those values can't be null or undefined
     * at this point. So now, the range is defined
     */
    const startRow = startWell.row!;
    const endRow = endWell.row!;
    const startCol = startWell.column!;
    const endCol = endWell.column!;
    /**
     * Based on the range defined earlier, we now set the boundaries of the rectangular, so
     * that we iterate only over the necessary wells.
     * To this extend, we calculate:
     * minRow -> indices of the smallest row
     * maxRow -> indices of the largest row
     * _same for the columns_
     */
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.min(Math.max(startCol, endCol), this.columns - 1); // prevents out of bound error
    /**
     * we initialise an empty well array that will hold all the wells within the range, that
     * later will be marked as selected.
     */
    const wellsInRange: Well[] = [];

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        wellsInRange.push(this.wells[row][col]);
      }
    }
    return wellsInRange;
  }

  toggleRowSelection(event: MouseEvent, rowIndex: number): void {
    const ctrlPressed = event.ctrlKey || event.metaKey;
    const rowWells = this.wells[rowIndex];

    if (ctrlPressed) {
      const allSelected = rowWells.every(well => this.selection.isSelected(well));
      if (allSelected) {
        this.selection.deselect(...rowWells);
      } else {
        this.selection.select(...rowWells);
      }
    } else {
      this.selection.clear();
      this.selection.select(...rowWells);
    }
    this.updateCurrentWellPosition();
    this.updateSampleInfo();
  }

  toggleColumnSelection(event: MouseEvent, columnIndex: number): void {
    const ctrlPressed = event.ctrlKey || event.metaKey;
    const colWells = this.wells.map(row => row[columnIndex]);

    if (ctrlPressed) {
      const allSelected = colWells.every(well => this.selection.isSelected(well));
      if (allSelected) {
        this.selection.deselect(...colWells);
      } else {
        this.selection.select(...colWells);
      }
    } else {
      this.selection.clear();
      this.selection.select(...colWells);
    }
    this.updateCurrentWellPosition();
    this.updateSampleInfo();
  }

  load(): void {
    this.selection.clear();
    this.mockWells.forEach(well => {
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
        rowIndex >= this.rows ||
        columnIndex < 0 ||
        columnIndex >= this.columns
      ) {
        console.error(
          `Well ID ${well.id} is out of bounds for the current plate size (${this.rows} rows x ${this.columns} columns).`
        );
        return;
      }
      this.selection.select(this.wells[rowIndex][columnIndex]);
    });
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
    if (this.selection.selected.length === 1) {
      this.currentWell = this.selection.selected[0];
      this.selectedWellsPositions = this.currentWell.id;
    } else if (this.selection.selected.length > 1) {
      this.currentWell = null;
      this.selectedWellsPositions = this.selection.selected.map(well => well.id).join(" ");
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
    if (this.currentWell) {
      this.sampleId = this.currentWell.sampleId || '';
      this.sampleRole = this.currentWell.sampleRole || 'Unknown Sample';
    } else {
      this.sampleId = '';
      this.sampleRole = 'Unknown Sample';
      this.selection.selected.forEach(well => {
        if (well.sampleId != undefined) {
          this.sampleId += well.sampleId + " ";
        }

      });
      if (this.sampleId === '')
        this.sampleId = "No sample id has been entered"
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
    this.selection.selected.forEach(well => {
      well.sampleId = newSampleId;
    });
  }

  /**
   * This method is very similar with the one above, the only difference being that
   * it is updating the Sample Role property.
   */
  onSampleRoleChange(newSampleRole: string): void {
    this.sampleRole = newSampleRole;
    this.selection.selected.forEach(well => {
      well.sampleRole = newSampleRole;
    });
  }
}
