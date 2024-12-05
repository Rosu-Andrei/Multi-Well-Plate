import {createReducer, on} from '@ngrx/store';
import {clearSelection, updateSelectedRowKeys, updateSelectedWellIds, updateWellSample} from './well.action';
import {initialSelectionState, initialState} from "./well.state";

/**
 * the reducer listens for the actions defined, in this case the only actions defined and
 * that it listens is "updateWellSample".
 *
 * initially, the reducer has the initial state of the store, represented by the first argument "initialState".
 * one an action of type "updateWellSample" has happened.
 *
 * The "state" variable represent the current state of a well. When a well receives changes in either sampleId or sampleRole,
 * the reducer will take the current state of that well (does this using the id) and returns a new sample
 * for that well with the new changes that have been made. Because we return a new state, this means we have immutability.
 */
export const wellSamplesReducer = createReducer(
  initialState,
  on(updateWellSample, (state, {wellId, changes}) => {
    const existingSample = state.samples[wellId] || {}; // retrieve the current sampleId and sampleRole of the well identified by its id
    return {
      ...state,
      samples: {
        ...state.samples,
        [wellId]: {
          ...existingSample,
          ...changes,
          /**
           * if the targetNames field has been updated, we use the new data (that was either added or removed). If no modification
           * took place, we use the same data already.
           */
          targetNames: changes.targetNames ? [...changes.targetNames] : existingSample.targetNames
        },
      },
    };
  })
);

export const wellSelectionReducer = createReducer(
  initialSelectionState,
  on(updateSelectedWellIds, (state, {selectedWellIds}) => ({
    ...state,
    selectedWellIds,
  })),
  on(updateSelectedRowKeys, (state, {selectedRowKeys}) => ({
    ...state,
    selectedRowKeys,
  })),
  on(clearSelection, (state) => ({
    ...state,
    selectedWellIds: [],
    selectedRowKeys: [],
  }))
);
