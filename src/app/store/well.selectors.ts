import {createSelector, createFeatureSelector} from '@ngrx/store';
import {WellSamplesState} from "./well.state";


export const selectWellSamplesState = createFeatureSelector<WellSamplesState>('wellSamples');

export const selectSampleByWellId = (wellId: string) =>
  createSelector(selectWellSamplesState, (state) => state.samples[wellId] || {});

export const selectAllSamples = createSelector(
  selectWellSamplesState,
  (state) => state.samples
);
