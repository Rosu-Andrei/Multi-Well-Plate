import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-multi-well-plate',
  templateUrl: './multi-well-plate.component.html',
  styleUrl: './multi-well-plate.component.css'
})
export class MultiWellPlateComponent {

  numberOfWells: number = 96;
  rows: number = 0;
  columns: number = 0;
  rowHeaders: string[] = [];
  columnHeaders: string[] = [];

  wells: any[][] = [];


  ngOnInit(): void {
    this.setupPlate();
  }

  setupPlate(): void {
    if (this.numberOfWells === 96) {
      this.rows = 8;
      this.columns = 12;
    } else if (this.numberOfWells === 384) {
      this.rows = 16;
      this.columns = 24;
    } else {
      throw new Error("Unsupported plate size")
    }

    for (let i: number = 1; i <= this.rows; i++) {
      this.rowHeaders.push(`${i}`)
    }

    for (let i: number = 1; i <= this.columns; i++) {
      let colHeader = String.fromCharCode(65 + (i % 26));
      this.columnHeaders.push(colHeader);
    }

    this.wells = Array.from({length: this.rows}, () =>
      Array.from({length: this.columns}, () => null)
    );
  }
}
