import {Component} from '@angular/core';

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
  wells: any[][] = [];

  selectPlate(plateSize: number | undefined): void {
    // Check for valid plate size and handle unsupported sizes
    if (plateSize != 96 && plateSize != 384) {
      console.error("Unsupported plate size:", plateSize);
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

    // Clear existing headers and wells before repopulating
    this.rowHeaders = [];
    this.columnHeaders = [];
    this.wells = [];

    // Generate row headers (1, 2, 3, ...)
    //this.rowHeaders = Array.from({length: this.rows}, (_, i) => `${i + 1}`);

    for (let i = 0; i < this.rows; i++) {
      this.rowHeaders.push(`${i + 1}`)
    }

    // Generate column headers (A, B, C, ..., AA, AB, etc.)
    this.columnHeaders = Array.from({length: this.columns}, (_, i) => {
      let letters = '';
      let num = i;
      while (num >= 0) {
        letters = String.fromCharCode(65 + (num % 26)) + letters;
        num = Math.floor(num / 26) - 1;
      }
      return letters;
    });

    // Generate wells
    this.wells = Array.from({length: this.rows}, () =>
      Array.from({length: this.columns}, () => null)
    );
  }
}
