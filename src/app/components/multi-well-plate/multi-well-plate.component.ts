import {Component, OnInit, OnDestroy} from '@angular/core';
import {faBars, faFlask, faSearchMinus, faSearchPlus,} from '@fortawesome/free-solid-svg-icons';
import {mockWells, Well} from '../../model/well';
import {PlateService} from '../../services/plate.service';
import {WellSelectionService} from '../../services/well-selection.service';
import {Store} from '@ngrx/store';
import {WellSample, AppState} from '../../store/well.state';
import {updateWellSample, updateSelectedRowKeys, clearSelection} from '../../store/well.action';
import {ChartDataItem} from '../../model/chart';
import {Subscription} from 'rxjs';
import {selectAllSamples, selectSelectedRowKeys} from "../../store/well.selectors";

@Component({
  selector: 'app-multi-well-plate',
  templateUrl: './multi-well-plate.component.html',
  styleUrls: ['./multi-well-plate.component.css'],
})
export class MultiWellPlateComponent implements OnInit, OnDestroy {
  faFlask = faFlask;
  faSearchPlus = faSearchPlus;
  faSearchMinus = faSearchMinus;
  faBars = faBars;

  zoomLevel: number = 1;
  menuVisible: boolean = false;
  activeTab: string = 'well-settings';
  sampleId: string = '';
  sampleRole: string = 'Unknown Sample';
  targetNames: string = '';
  currentWell: Well | null = null;
  selectedWellsPositions: string = '';

  baseCellSize: number = 30;
  samples: Record<string, WellSample> = {};

  isChartVisible: boolean = false;
  chartData: any[] = [];
  mockChartData: ChartDataItem[] = [];

  selectedWellIds: string[] = [];
  selectedRowKeys: string[] = [];
  private subscriptions: Subscription = new Subscription();

  constructor(
    public plateService: PlateService,
    public selectionService: WellSelectionService,
    private store: Store<AppState>
  ) {
  }


  ngOnInit(): void {
    // Subscribe to selectedRowKeys to update selectedWellIds
    this.subscriptions.add(
      this.store.select(selectSelectedRowKeys).subscribe((selectedRowKeys) => {
        this.selectedRowKeys = selectedRowKeys;
        const selectedWellIdsFromRowKeys = Array.from(
          new Set(selectedRowKeys.map((key) => key.split('_')[0]))
        );

        // Update selectedWellIds only if they have changed
        if (this.selectedWellIds.sort().join(',') !== selectedWellIdsFromRowKeys.sort().join(',')) {
          this.selectedWellIds = selectedWellIdsFromRowKeys;
          this.updateCurrentWellPosition();
          this.updateSampleInfo();
        }
      })
    );

    // Subscribe to samples
    this.subscriptions.add(
      this.store.select(selectAllSamples).subscribe((samples) => {
        this.samples = samples;
      })
    );
  }

  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    this.subscriptions.unsubscribe();
  }

  get cellSize(): number {
    return this.baseCellSize * this.zoomLevel;
  }

  /**
   * This method is called the moment a user selects the plate size (96 or 384)
   */
  selectPlate(plateSize: number | undefined): void {
    if (plateSize !== 96 && plateSize !== 384) {
      console.error('Unsupported plate size:', plateSize);
      return;
    }
    /**
     * the plateService is going to create the appropriate well[] based on the size.
     * It will also create the headers for the rows and columns.
     */
    this.plateService.setupPlate(plateSize);
    /**
     * the moment a new size of plate is selected, the selectionService will:
     * 1. clear all the current selections
     * 2.
     */
    this.selectionService.clearSelection();
    this.selectionService.initializeWorker();
  }

  /**
   * the load function it is used to populate all the components with data already prepared. It
   */
  load(): void {
    this.selectionService.clearSelection();

    /**
     * from each mock well we extract its data. We then check if in the plate exists a well with the id of
     * the mock well, and if indeed exists, we dispatch to the store an update action.
     */
    mockWells.forEach((mockWell) => {
      const wellId = mockWell.id;
      const sampleId = mockWell.sampleId;
      const sampleRole = mockWell.sampleRole;
      const targetNames = mockWell.targetName
        ? mockWell.targetName.split(',').map((name) => name.trim()).slice(0, 7)
        : [];

      const well = this.plateService.getFlatWells().find((w) => w.id === wellId);
      if (well) {
        this.store.dispatch(
          updateWellSample({
            wellId: well.id,
            changes: {
              sampleId: sampleId,
              sampleRole: sampleRole,
              targetNames: targetNames,
            },
          })
        );
      } else {
        console.error(`Well ID ${wellId} not found on the current plate.`);
      }
    });

    this.generateMockChartData();
    this.prepareChartData();
  }

  /**
   * When the user selects a well in the plate, it will trigger this method to be called.
   * The method receives 2 parameters, first the event that can contain data such as
   * (if ctrl or shift was pressed when the well was clicked) and the second will be the
   * Well object itself, for example :
   * {id: 'A1', row: 0, column: 0, sampleRole: 'Negative Process Control', sampleId: '12', targetNames: ['Target5', 'Target4'] }
   * The component will call the selectionService method with the same name.
   */
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

  isSelected(well: Well): boolean {
    return this.selectedWellIds.includes(well.id);
  }


  updateCurrentWellPosition(): void {
    const selectedWells = this.plateService
      .getFlatWells()
      .filter((well) => this.selectedWellIds.includes(well.id));

    if (selectedWells.length === 1) {
      this.currentWell = selectedWells[0];
      this.selectedWellsPositions = this.currentWell.id;
    } else if (selectedWells.length > 1) {
      this.currentWell = null;
      this.selectedWellsPositions = selectedWells.map((well) => well.id).join(' ');
    } else {
      this.currentWell = null;
      this.selectedWellsPositions = '';
    }
  }

  updateSampleInfo(): void {
    const selectedWells = this.plateService
      .getFlatWells()
      .filter((well) => this.selectedWellIds.includes(well.id));

    if (this.currentWell) {
      const sampleData = this.samples[this.currentWell.id] || {};
      this.sampleId = sampleData.sampleId || '';
      this.sampleRole = sampleData.sampleRole || 'Unknown Sample';
      this.targetNames = (sampleData.targetNames || []).join(', ');
    } else {
      this.sampleId = '';
      this.sampleRole = 'Unknown Sample';
      this.targetNames = '';
      selectedWells.forEach((well) => {
        const sampleData = this.samples[well.id] || {};
        if (sampleData.sampleId) {
          this.sampleId += sampleData.sampleId + ' ';
        }
      });
      if (this.sampleId.trim() === '') {
        this.sampleId = 'No sample ID has been entered';
      }
    }
  }

  onSampleIdChange(newSampleId: string): void {
    this.sampleId = newSampleId;
    this.selectedWellIds.forEach((wellId) => {
      this.store.dispatch(updateWellSample({wellId, changes: {sampleId: newSampleId}}));
    });
  }

  onSampleRoleChange(newSampleRole: string): void {
    this.sampleRole = newSampleRole;
    this.selectedWellIds.forEach((wellId) => {
      this.store.dispatch(updateWellSample({wellId, changes: {sampleRole: newSampleRole}}));
    });
  }

  onTargetNameChange(newTargetNames: string): void {
    this.targetNames = newTargetNames;
    const targetNamesArray = newTargetNames.split(',').map((name) => name.trim()).slice(0, 7);
    this.selectedWellIds.forEach((wellId) => {
      this.store.dispatch(updateWellSample({wellId, changes: {targetNames: targetNamesArray}}));
    });
  }

  generateMockChartData(): void {
    this.mockChartData = [];

    mockWells.forEach((well) => {
      const wellId = well.id;
      const targetNames = well.targetName
        ? well.targetName.split(',').map((name) => name.trim())
        : [];

      targetNames.forEach((targetName) => {
        const x = Array.from({length: 45}, (_, i) => i + 1);
        const y = x.map(() => Math.random() / 10);

        this.mockChartData.push({
          wellId: wellId,
          targetName: targetName,
          x: x,
          y: y,
        });
      });
    });
  }

  prepareChartData(): void {
    this.chartData = [];
    this.mockChartData.forEach((dataItem) => {
      const trace = {
        x: dataItem.x,
        y: dataItem.y,
        type: 'scattergl',
        mode: 'lines',
        name: `${dataItem.wellId}_${dataItem.targetName}`,
        hovertemplate: `<i>Well ID: ${dataItem.wellId}, Target Name: ${dataItem.targetName}</i><br>X: %{x}<br>Y: %{y}<extra></extra>`,
        line: {
          width: 2,
          opacity: 1,
        },
      };
      this.chartData.push(trace);
    });
  }

  onWellSelected(rowKey: string): void {
    if (rowKey === 'clearSelection') {
      this.store.dispatch(clearSelection());
    } else {
      this.store.dispatch(updateSelectedRowKeys({selectedRowKeys: [rowKey]}));
    }
  }

  toggleChart(): void {
    this.isChartVisible = !this.isChartVisible;
  }
}
