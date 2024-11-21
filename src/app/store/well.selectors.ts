import {createSelector, createFeatureSelector} from '@ngrx/store';
import {WellSamplesState} from "./well.state";

/**
 * The role of the selectors are to access a specific piece of data from the well state store
 */

/**
 * this selector points to the well part of the state store. It does this by using the name
 * we provided as the identifier of the well part of the state store
 */
export const selectWellSamplesState = createFeatureSelector<WellSamplesState>('wellSamples');

/**
 * this selector takes a wellId as an argument and uses the more general selector of the well state to return
 * the sample data of that specific well
 */
export const selectSampleByWellId = (wellId: string) =>
  createSelector(selectWellSamplesState, (state) => state.samples[wellId] || {});

/**
 * this selector is used to return the sample data of all the wells
 */
export const selectAllSamples = createSelector(
  selectWellSamplesState,
  (state) => state.samples
);
