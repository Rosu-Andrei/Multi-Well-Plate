import {Injectable} from '@angular/core';
import {SelectionModel} from "@angular/cdk/collections";
import {Well} from "../model/well";
import {PlateService} from "./plate.service";

@Injectable({
  providedIn: 'root',
})
export class WellSelectionService {

  selection = new SelectionModel<Well>(true, []);
  lastSelectedWell: Well | null = null;

  constructor(private plateService: PlateService) {
  }

  toggleWellSelection(event: MouseEvent, well: Well): void {
    const ctrlPressed: boolean = event.ctrlKey || event.metaKey;
    const shiftPressed: boolean = event.shiftKey;

    if (ctrlPressed && shiftPressed && this.lastSelectedWell) {
      //const newSelection = this.getWellsInRange(this.lastSelectedWell, well);
    }
  }
}
