import {Injectable} from '@angular/core';
import {SelectionModel} from '@angular/cdk/collections';
import {PlateService} from './plate.service';
import {Well} from "../model/well";

@Injectable({
  providedIn: 'root',
})
export class WellSelectionService {
  selection = new SelectionModel<Well>(true, []);
  lastSelectedWell: Well | null = null;

  constructor(private plateService: PlateService) {
  }

  toggleWellSelection(event: MouseEvent, well: Well): void {
    const ctrlPressed = event.ctrlKey || event.metaKey;
    const shiftPressed = event.shiftKey;

    if (ctrlPressed && shiftPressed && this.lastSelectedWell) {
      const newSelection = this.getWellsInRange(this.lastSelectedWell, well);
      this.selection.select(...newSelection);
    } else if (ctrlPressed) {
      this.selection.toggle(well);
      this.lastSelectedWell = well;
    } else {
      this.selection.clear();
      this.selection.select(well);
      this.lastSelectedWell = well;
    }
  }

  getWellsInRange(startWell: Well, endWell: Well): Well[] {
    const startRow = startWell.row!;
    const endRow = endWell.row!;
    const startCol = startWell.column!;
    const endCol = endWell.column!;

    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);

    const wellsInRange: Well[] = [];
    const wells = this.plateService.getWells();

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        wellsInRange.push(wells[row][col]);
      }
    }
    return wellsInRange;
  }

  toggleRowSelection(event: MouseEvent, rowIndex: number): void {
    const ctrlPressed = event.ctrlKey || event.metaKey;
    const rowWells = this.plateService.getWells()[rowIndex];

    if (ctrlPressed) {
      const allSelected = rowWells.every((well) => this.selection.isSelected(well));
      if (allSelected) {
        this.selection.deselect(...rowWells);
      } else {
        this.selection.select(...rowWells);
      }
    } else {
      this.selection.clear();
      this.selection.select(...rowWells);
    }
  }

  toggleColumnSelection(event: MouseEvent, columnIndex: number): void {
    const ctrlPressed = event.ctrlKey || event.metaKey;
    const wells = this.plateService.getWells();
    const colWells = wells.map((row) => row[columnIndex]);

    if (ctrlPressed) {
      const allSelected = colWells.every((well) => this.selection.isSelected(well));
      if (allSelected) {
        this.selection.deselect(...colWells);
      } else {
        this.selection.select(...colWells);
      }
    } else {
      this.selection.clear();
      this.selection.select(...colWells);
    }
  }

  clearSelection(): void {
    this.selection.clear();
    this.lastSelectedWell = null;
  }
}
