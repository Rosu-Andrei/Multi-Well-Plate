import {Component, OnInit} from '@angular/core';
import {
  faBars,
  faFlask,
  faSearchMinus,
  faSearchPlus,
} from '@fortawesome/free-solid-svg-icons';
import {mockWells, Well} from '../model/well';
import {PlateService} from '../services/plate.service';
import {WellSelectionService} from '../services/well-selection.service';

@Component({
  selector: 'app-multi-well-plate',
  templateUrl: './multi-well-plate.component.html',
  styleUrls: ['./multi-well-plate.component.css'],
})
export class MultiWellPlateComponent implements OnInit {
  faFlask = faFlask;
  faSearchPlus = faSearchPlus;
  faSearchMinus = faSearchMinus;
  faBars = faBars;

  zoomLevel: number = 1; // Initial zoom level
  menuVisible: boolean = false; // Whether the side menu is visible or not
  activeTab: string = 'well-settings'; // Default active tab
  sampleId: string = ''; // Default sample ID
  sampleRole: string = 'Unknown Sample'; // Default sample role
  currentWell: Well | null = null; // Currently selected single well
  selectedWellsPositions: string = ''; // IDs of selected wells

  baseCellSize: number = 30; // Base size for cells in pixels


  constructor(
    public plateService: PlateService,
    public selectionService: WellSelectionService
  ) {
  }

  ngOnInit(): void {
    /**
     * we subscribe to the Subject so that we receive the data that it emits.
     */
    this.selectionService.selectionChangeSubject.subscribe(
      (selectedWells: Well[]) => {
        this.updateCurrentWellPosition();
        this.updateSampleInfo();
      }
    );
  }

  get cellSize(): number {
    return this.baseCellSize * this.zoomLevel;
  }

  selectPlate(plateSize: number | undefined): void {
    if (plateSize !== 96 && plateSize !== 384) {
      console.error('Unsupported plate size:', plateSize);
      return;
    }
    this.plateService.setupPlate(plateSize);
    this.selectionService.clearSelection();
    this.selectionService.initializeWorker(); // Re-initialize worker with new wells
  }

  load(): void {
    this.selectionService.clearSelection();
    mockWells.forEach((well) => {
      const columnChar = well.id.charAt(0);
      const rowStr = well.id.slice(1);

      if (!columnChar || !rowStr) {
        console.error(`Invalid well ID: ${well.id}`);
        return;
      }

      const columnIndex = columnChar.charCodeAt(0) - 65;
      const rowIndex = parseInt(rowStr, 10) - 1;

      if (
        rowIndex < 0 ||
        rowIndex >= this.plateService.rows ||
        columnIndex < 0 ||
        columnIndex >= this.plateService.columns
      ) {
        console.error(
          `Well ID ${well.id} is out of bounds for the current plate size (${this.plateService.rows} rows x ${this.plateService.columns} columns).`
        );
        return;
      }
      const selectedWell = this.plateService.getWells()[rowIndex][columnIndex];
      // Simulate a selection event
      const event = {
        ctrlKey: true,
        metaKey: true,
        shiftKey: false,
      } as MouseEvent;
      this.selectionService.toggleWellSelection(event, selectedWell);
    });
  }

  toggleWellSelection(event: MouseEvent, well: Well): void {
    this.selectionService.toggleWellSelection(event, well);
  }

  toggleRowSelection(event: MouseEvent, rowIndex: number): void {
    this.selectionService.toggleRowSelection(event, rowIndex);
  }

  toggleColumnSelection(event: MouseEvent, columnIndex: number): void {
    this.selectionService.toggleColumnSelection(event, columnIndex);
  }

  zoomIn(): void {
    if (this.zoomLevel < 3) {
      this.zoomLevel += 0.1;
      this.zoomLevel = Math.round(this.zoomLevel * 10) / 10;
    }
  }

  zoomOut(): void {
    if (this.zoomLevel > 0.5) {
      this.zoomLevel = Math.max(0.5, this.zoomLevel - 0.1);
      this.zoomLevel = Math.round(this.zoomLevel * 10) / 10;
    }
  }

  toggleMenu(): void {
    this.menuVisible = !this.menuVisible;
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  updateCurrentWellPosition(): void {
    const selection = this.selectionService.selection;
    if (selection.selected.length === 1) {
      this.currentWell = selection.selected[0];
      this.selectedWellsPositions = this.currentWell.id;
    } else if (selection.selected.length > 1) {
      this.currentWell = null;
      this.selectedWellsPositions = selection.selected
        .map((well) => well.id)
        .join(' ');
    } else {
      this.currentWell = null;
      this.selectedWellsPositions = '';
    }
  }

  updateSampleInfo(): void {
    const array = this.selectionService.selection.selected;
    if (this.currentWell) {
      this.sampleId = this.currentWell.sampleId || '';
      this.sampleRole = this.currentWell.sampleRole || 'Unknown Sample';
    } else {
      this.sampleId = '';
      this.sampleRole = 'Unknown Sample';
      array.forEach((well) => {
        if (well.sampleId) {
          this.sampleId += well.sampleId + ' ';
        }
      });
      if (this.sampleId.trim() === '') {
        this.sampleId = 'No sample ID has been entered';
      }
    }
  }

  onSampleIdChange(newSampleId: string): void {
    this.sampleId = newSampleId;
    this.selectionService.selection.selected.forEach((well) => {
      well.sampleId = newSampleId;
    });
  }

  onSampleRoleChange(newSampleRole: string): void {
    this.sampleRole = newSampleRole;
    this.selectionService.selection.selected.forEach((well) => {
      well.sampleRole = newSampleRole;
    });
  }
}
