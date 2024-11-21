import {Component, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {updateWellSample} from '../store/well.action';
import {selectAllSamples} from '../store/well.selectors';
import {Well} from '../model/well';
import {PlateService} from '../services/plate.service';
import {WellSamplesState} from "../store/well.state";


@Component({
  selector: 'app-plate-table',
  templateUrl: './plate-table.component.html',
  styleUrls: ['./plate-table.component.css']
})
export class PlateTableComponent implements OnInit {
  wells: Well[] = [];
  samples: { [wellId: string]: { sampleId?: string; sampleRole?: string } } = {};

  constructor(
    private plateService: PlateService,
    private store: Store<WellSamplesState>
  ) {
  }

  ngOnInit(): void {
    this.store.select(selectAllSamples).subscribe((samples) => {
      this.samples = samples;
      this.wells = this.plateService.getFlatWells().map((well) => ({
        ...well,
        sampleId: samples[well.id]?.sampleId,
        sampleRole: samples[well.id]?.sampleRole,
      }));
    });
  }

  rowIndex = (data: any) => data.row + 1;
  columnIndex = (data: any) => String.fromCharCode(data.column + 65);

  onRowUpdating(event: any): void {
    const wellId = event.oldData.id;
    const changes = event.newData;
    const sampleId = changes.sampleId !== undefined ? changes.sampleId : this.samples[wellId]?.sampleId;
    const sampleRole = changes.sampleRole !== undefined ? changes.sampleRole : this.samples[wellId]?.sampleRole;
    this.store.dispatch(updateWellSample({ wellId, sampleId, sampleRole }));
  }

}
