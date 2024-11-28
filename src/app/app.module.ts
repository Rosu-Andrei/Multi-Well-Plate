import {NgModule} from '@angular/core';
import {BrowserModule, provideClientHydration} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {MultiWellPlateComponent} from './components/multi-well-plate/multi-well-plate.component';
import {MatRadioModule} from "@angular/material/radio";
import {FormsModule} from "@angular/forms";
import {MatButtonToggle} from "@angular/material/button-toggle";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {DxDataGridModule} from "devextreme-angular";
import {PlateTableComponent} from './components/plate-table/plate-table.component';
import {StoreModule} from "@ngrx/store";
import {wellSamplesReducer} from "./store/well.reducer";
import * as PlotlyJS from 'plotly.js-dist-min';
import {PlotlyModule} from 'angular-plotly.js';
import { PlotlyChartComponent } from './components/plotly-chart/plotly-chart.component';

PlotlyModule.plotlyjs = PlotlyJS;

@NgModule({
  declarations: [
    AppComponent,
    MultiWellPlateComponent,
    PlateTableComponent,
    PlotlyChartComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatRadioModule,
    FormsModule,
    MatButtonToggle,
    FontAwesomeModule,
    DxDataGridModule,
    StoreModule.forRoot({wellSamples: wellSamplesReducer}),
    PlotlyModule
  ],
  providers: [
    provideClientHydration(),
    provideAnimationsAsync()
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
