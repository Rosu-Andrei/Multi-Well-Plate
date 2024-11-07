import {Component} from '@angular/core';
import {SelectionModel} from '@angular/cdk/collections';

interface Well {
  id: string;      // Unique identifier (e.g., 'A1', 'B2')
  row: number;     // Row index
  column: number;  // Column index
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
  wells: Well[][] = []; // Update wells to be an array of Well objects

  // Initialize SelectionModel for multiple selection
  selection = new SelectionModel<Well>(true, []);

  selectPlate(plateSize: number | undefined): void {
    if (plateSize != 96 && plateSize != 384) {
      console.error('Unsupported plate size:', plateSize);
      return;
    }

    this.numberOfWells = plateSize;
    this.setupPlate();
  }

  setupPlate(): void {
    // Set rows and columns based on plate size
    if (this.numberOfWells == 96) {
      this.rows = 8;
      this.columns = 12;
    } else if (this.numberOfWells == 384) {
      this.rows = 16;
      this.columns = 24;
    }

    // Clear existing data
    this.rowHeaders = [];
    this.columnHeaders = [];
    this.wells = [];

    // Generate row headers ('1', '2', ..., '16')
    for (let i = 0; i < this.rows; i++) {
      this.rowHeaders.push(`${i + 1}`);
    }

    // Generate column headers ('A', 'B', ..., 'Z', 'AA', 'AB', ...)
    this.columnHeaders = Array.from({length: this.columns}, (_, i) => {
      let letters = '';
      let num = i;
      while (num >= 0) {
        letters = String.fromCharCode(65 + (num % 26)) + letters;
        num = Math.floor(num / 26) - 1;
      }
      return letters;
    });

    // Generate wells as Well objects with unique IDs
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

  // Toggle selection of a single well
  toggleWellSelection(event: MouseEvent, well: Well): void {
    /**
     * Check if ctrl was pressed (or command for mac)
     */
    const ctrlPressed = event.ctrlKey || event.metaKey;

    if (ctrlPressed) {
      /**
       * toggle the selection state of a single well. If ctrl was pressed,
       * we for each visited well we "toggle it", meaning:
       *    If the well is currently selected: toggle will deselect it, removing it from the selected items.
       *    If the well is not currently selected: toggle will select it, adding it to the selected items.
       */
      this.selection.toggle(well);
    } else {
      /**
       * If we are here, it means that ctrl isn't pressed, and so we select only one well.
       */
      this.selection.clear();
      this.selection.select(well);
    }
  }

  // Toggle selection of an entire row
  toggleRowSelection(event: MouseEvent, rowIndex: number): void {
    const ctrlPressed = event.ctrlKey || event.metaKey;
    const rowWells = this.wells[rowIndex];

    if (ctrlPressed) {
      // Check if all wells in the row are selected
      const allSelected = rowWells.every(well => this.selection.isSelected(well));
      if (allSelected) {
        // Deselect all wells in the row
        this.selection.deselect(...rowWells);
      } else {
        // Select all wells in the row
        this.selection.select(...rowWells);
      }
    } else {
      // Clear other selections and select the entire row
      this.selection.clear();
      this.selection.select(...rowWells);
    }
  }

  // Toggle selection of an entire column
  toggleColumnSelection(event: MouseEvent, colIndex: number): void {
    const ctrlPressed = event.ctrlKey || event.metaKey;
    const colWells = this.wells.map(row => row[colIndex]);

    if (ctrlPressed) {
      // Check if all wells in the column are selected
      const allSelected = colWells.every(well => this.selection.isSelected(well));
      if (allSelected) {
        // Deselect all wells in the column
        this.selection.deselect(...colWells);
      } else {
        // Select all wells in the column
        this.selection.select(...colWells);
      }
    } else {
      // Clear other selections and select the entire column
      this.selection.clear();
      this.selection.select(...colWells);
    }
  }
}
