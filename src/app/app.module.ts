import {NgModule} from '@angular/core';
import {BrowserModule, provideClientHydration} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {MultiWellPlateComponent} from './multi-well-plate/multi-well-plate.component';
import {MatRadioModule} from "@angular/material/radio";
import {FormsModule} from "@angular/forms";
import {MatButtonToggle} from "@angular/material/button-toggle";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {DxDataGridModule} from "devextreme-angular";
import {PlateTableComponent} from './plate-table/plate-table.component';
import {StoreModule} from "@ngrx/store";
import {wellReducer} from "./store/well.reducer";

@NgModule({
  declarations: [
    AppComponent,
    MultiWellPlateComponent,
    PlateTableComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatRadioModule,
    FormsModule,
    MatButtonToggle,
    FontAwesomeModule,
    DxDataGridModule,
    StoreModule.forRoot({wellState: wellReducer})
  ],
  providers: [
    provideClientHydration(),
    provideAnimationsAsync()
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
