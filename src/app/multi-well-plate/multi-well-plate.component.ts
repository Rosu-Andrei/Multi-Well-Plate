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
  faFlask = faFlask;
  faSearchPlus = faSearchPlus;
  faSearchMinus = faSearchMinus;
  faBars = faBars;
  selection = new SelectionModel<Well>(true, []);

  mockWells: Well[] = [
    {id: 'F5'},
    {id: 'A1'},
    {id: 'X16'}
  ];

  menuVisible: boolean = false; // Whether the side menu is visible or not
  activeTab: string = 'well-settings'; // Default active tab
  sampleId: string = ''; // Default sample ID
  sampleRole: string = 'Unknown Sample'; // Default sample role
  currentWell: Well | null = null; // Currently selected single well

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

  toggleWellSelection(event: MouseEvent, well: Well): void {
    const ctrlPressed = event.ctrlKey || event.metaKey;
    if (ctrlPressed) {
      this.selection.toggle(well);
    } else {
      this.selection.clear();
      this.selection.select(well);
    }
    this.updateCurrentWell();
    this.updateSampleInfo();
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
    this.updateCurrentWell();
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
    this.updateCurrentWell();
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
  updateCurrentWell(): void {
    if (this.selection.selected.length === 1) {
      this.currentWell = this.selection.selected[0];
    } else {
      this.currentWell = null;
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
    }
  }

  onSampleIdChange(newSampleId: string): void {
    this.sampleId = newSampleId;
    this.selection.selected.forEach(well => {
      well.sampleId = newSampleId;
    });
  }

  onSampleRoleChange(newSampleRole: string): void {
    this.sampleRole = newSampleRole;
    this.selection.selected.forEach(well => {
      well.sampleRole = newSampleRole;
    });
  }
}
