import {createFeatureSelector, createSelector} from "@ngrx/store";
import {WellState} from "./well.state";

/**
 * Get complete state of the wells in application
 */
export const selectWellState = createFeatureSelector<WellState>("wellState");

export const selectAllWells = createSelector(
  selectWellState,
  (state: WellState) => state.wells
);
export const selectWellById = (wellId: string) =>
  createSelector(selectAllWells, (wells) => wells.find((well) => well.id === wellId));
