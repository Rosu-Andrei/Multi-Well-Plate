import {Component, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {updateWellSample} from '../store/well.action';
import {selectAllSamples} from '../store/well.selectors';
import {Well} from '../model/well';
import {PlateService} from '../services/plate.service';
import {WellSample, WellSamplesState} from "../store/well.state";


@Component({
    selector: 'app-plate-table',
    templateUrl: './plate-table.component.html',
    styleUrls: ['./plate-table.component.css']
})
export class PlateTableComponent implements OnInit {
    wells: Well[] = [];
    samples: Record<string, WellSample> = {};
    selectedWellIds: Well[] = [];

    constructor(
        private plateService: PlateService,
        private store: Store<WellSamplesState>
    ) {
    }

    /**
     * we update the well[] provided by the plate service every time using the store subscription. We do this because the well[]
     * represents the data set for the table.
     */
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

    /**
     *every time a table cell receives an update on either sampleID or sampleRole,
     * a new action is triggered that will update the state store.
     */
    onRowUpdating(event: any): void {
        const isMultipleSelection = this.selectedWellIds.length > 1;
        const changes: Partial<WellSample> = {};

        if (event.newData.sampleId !== undefined) {
            changes.sampleId = event.newData.sampleId;
        }

        if (event.newData.sampleRole !== undefined) {
            changes.sampleRole = event.newData.sampleRole;
        }

        if (isMultipleSelection) {
            // Apply changes to all selected wells
            this.selectedWellIds.forEach((wellData) => {
                let wellId = wellData.id;
                this.store.dispatch(updateWellSample({wellId, changes: changes}));
            });
        } else {
            // Apply changes to the single row being updated
            const wellId = event.oldData.id;
            this.store.dispatch(updateWellSample({wellId, changes: changes}));
        }
    }

    onSelectionChanged(event: any): void {
        this.selectedWellIds = event.selectedRowKeys;
    }

    testSelect() {
        this.selectedWellIds.forEach(well => console.log(well.sampleId))
    }

}
