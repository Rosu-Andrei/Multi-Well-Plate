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
    this.rowHeaders = Array.from({length: this.rows}, (_, i) => `${i + 1}`);

    this.columnHeaders = Array.from({length: this.columns}, (_, i) => {
      let letters = '';
      let num = i;
      while (num >= 0) {
        letters = String.fromCharCode(65 + (num % 26)) + letters;
        num = Math.floor(num / 26) - 1;
      }
      return letters;
    });
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

}
