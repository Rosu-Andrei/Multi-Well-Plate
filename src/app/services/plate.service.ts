import {Injectable} from '@angular/core';
import {Well} from "../model/well";
import {error} from "@angular/compiler-cli/src/transformers/util";

@Injectable({
  providedIn: 'root'
})
/**
 * Manages the setup and structure of the multi-well plate, including row/column headers and well data.
 *
 * This service will be responsible for the rendering of the plate based on the user input,
 * together with the row and column headers.
 */
export class PlateService {

  numberOfWells: number = 0;
  rows: number = 0;
  columns: number = 0;
  rowHeaders: string[] = [];
  columnHeaders: string[] = [];
  wells: Well[][] = [];

  public setupPlate(plateSize: number): void {
    if (plateSize != 96 && plateSize != 384) {
      throw error("Unsupported plate size: " + plateSize);
    }

    this.numberOfWells = plateSize;

    if (this.numberOfWells == 96) {
      this.rows = 8;
      this.columns = 12;
    } else if (this.numberOfWells == 384) {
      this.rows = 16;
      this.columns = 24;
    }
  }

  private initializeHeaders(): void {
    for (let i = 0; i < this.rows; i++) {
      this.rowHeaders.push(`${i + 1}`)
    }

    for (let i = 0; i < this.columns; i++) {
      let letter = String.fromCharCode(i + 65)
      this.columnHeaders.push(letter)
    }
  }

  private initializeWells(): void {
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
