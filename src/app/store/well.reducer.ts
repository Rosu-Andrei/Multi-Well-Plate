import {createReducer, on} from '@ngrx/store';
import {updateWellSample} from './well.action';
import {initialState} from "./well.state";


export const wellSamplesReducer = createReducer(
  initialState,
  on(updateWellSample, (state, {wellId, sampleId, sampleRole}) => {
    const existingSample = state.samples[wellId] || {};
    return {
      ...state,
      samples: {
        ...state.samples,
        [wellId]: {
          sampleId: sampleId !== undefined ? sampleId : existingSample.sampleId,
          sampleRole: sampleRole !== undefined ? sampleRole : existingSample.sampleRole,
        },
      },
    };
  })
);
