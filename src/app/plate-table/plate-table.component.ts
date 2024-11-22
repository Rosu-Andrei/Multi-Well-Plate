import {Component, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {updateWellSample} from '../store/well.action';
import {selectAllSamples} from '../store/well.selectors';
import {Well} from '../model/well';
import {PlateService} from '../services/plate.service';
import {WellSample, WellSamplesState} from "../store/well.state";
import {WellSelectionService} from "../services/well-selection.service";


@Component({
    selector: 'app-plate-table',
    templateUrl: './plate-table.component.html',
    styleUrls: ['./plate-table.component.css']
})
export class PlateTableComponent implements OnInit {
    wells: Well[] = [];
    samples: Record<string, WellSample> = {};
    selectedWells: Well[] = [];

    constructor(
        private plateService: PlateService,
        private store: Store<WellSamplesState>,
        private selectionService: WellSelectionService
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
        const isMultipleSelection = this.selectedWells.length > 1;
        const changes: Partial<WellSample> = {};

        if (event.newData.sampleId !== undefined) {
            changes.sampleId = event.newData.sampleId;
        }

        if (event.newData.sampleRole !== undefined) {
            changes.sampleRole = event.newData.sampleRole;
        }

        /**
         * if multiple rows are selected, then each of the rows will get the newly sampleID and / or sampleRole
         */
        if (isMultipleSelection) {
            // Apply changes to all selected wells
            this.selectedWells.forEach((wellData) => {
                let wellId = wellData.id;
                this.store.dispatch(updateWellSample({wellId, changes: changes}));
            });
        } else {
            const wellId = event.oldData.id;
            this.store.dispatch(updateWellSample({wellId, changes: changes}));
        }
    }

    /**
     * this method is used to get the current rows selected at a given time.
     */
    onSelectionChanged(event: any): void {
        this.selectedWells = event.selectedRowKeys;
        const selectedWellsId = this.selectedWells.map(well => well.id);
        this.updatePlateSelection(selectedWellsId);
    }

    /**
     * this method is going to send to the wellSelectService the wells that have been selected using the table.
     */
    updatePlateSelection(wellIds: string[]): void {
        const selectedWells = this.plateService.getFlatWells().filter(well => wellIds.includes(well.id));
        this.selectionService.updateSelectionFromTable(selectedWells);
    }

}
