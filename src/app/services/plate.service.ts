import {Injectable} from '@angular/core';
import {Well} from "../model/well";

@Injectable({
  providedIn: 'root',
})
export class PlateService {
  numberOfWells: number = 0;
  rows: number = 0;
  columns: number = 0;
  rowHeaders: string[] = [];
  columnHeaders: string[] = [];
  wells: Well[][] = [];

  setupPlate(plateSize: number): void {
    if (plateSize !== 96 && plateSize !== 384) {
      console.error('Unsupported plate size:', plateSize);
      return;
    }
    this.numberOfWells = plateSize;

    if (plateSize === 96) {
      this.rows = 8;
      this.columns = 12;
    } else if (plateSize === 384) {
      this.rows = 16;
      this.columns = 24;
    }

    this.initializeHeaders();
    this.initializeWells();
  }

  private initializeHeaders(): void {
    this.rowHeaders = [];
    for (let i = 0; i < this.rows; i++) {
      this.rowHeaders.push((i + 1).toString());
    }
    this.columnHeaders = [];
    for (let i = 0; i < this.columns; i++) {
      let columnName = '';
      let num = i;

      while (num >= 0) {
        // Get the letter corresponding to the current number
        const letter = String.fromCharCode(65 + (num % 26)); // 'A' is 65 in ASCII
        columnName = letter + columnName; // Add the letter to the column name
        num = Math.floor(num / 26) - 1; // Move to the next "digit"
      }

      this.columnHeaders.push(columnName);
    }
  }

  private initializeWells(): void {
    this.wells = [];
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

  getRowHeaders(): string[] {
    return this.rowHeaders;
  }

  getColumnHeaders(): string[] {
    return this.columnHeaders;
  }

  getWells(): Well[][] {
    return this.wells;
  }

  getFlatWells(): Well[] {
    return this.wells.flat();
  }

  updateWell(row: number, column: number, updatedWell: Well): void {
    this.wells = this.wells.map((currentRow, rowIndex) =>
      rowIndex === row ?
        currentRow.map((well, colIndex) => colIndex === column ? { ...well, ...updatedWell } : well)
        : currentRow
    );
  }

}
