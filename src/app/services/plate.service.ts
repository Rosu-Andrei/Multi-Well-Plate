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

  /**
   * this method will be called once the user selects a plate size. The method will instantiate the well matrix and
   * the headers of the rows and the columns.
   *
   * The properties that are here populate will be then used in the template (.html file)
   * of the multi-well-plate component.
   */
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

  /**
   * based on the plate size, will generate the row headers
   * and the column headers.
   */
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

  /**
   * this method will create the Well matrix that is going to be the plate representation.
   * It is called after the headers have been initialised because each well will receive as id
   * a combination of the row header and column header (for example, the firs well in the plate
   * will have the id "A1").
   */
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

}
