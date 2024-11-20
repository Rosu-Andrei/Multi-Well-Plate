import {Component, OnInit} from '@angular/core';
import {PlateService} from '../services/plate.service';
import {WellSelectionService} from '../services/well-selection.service';
import {Well} from '../model/well';

@Component({
  selector: 'app-plate-table',
  templateUrl: './plate-table.component.html',
  styleUrls: ['./plate-table.component.css']
})
export class PlateTableComponent implements OnInit {
  wells: Well[] = [];

  constructor(
    private plateService: PlateService,
    private selectionService: WellSelectionService
  ) {
  }

  ngOnInit(): void {
    this.wells = this.plateService.getFlatWells();
    console.log('Wells Data:', this.wells);
  }

  rowIndex = (data: any) => data.row + 1;
  columnIndex = (data: any) => String.fromCharCode(data.column + 65);
}
