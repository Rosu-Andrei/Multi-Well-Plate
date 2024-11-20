import {createReducer, on} from "@ngrx/store";
import {initialWellState} from "./well.state";
import {loadWells, updateWell} from "./well.action";

/**
 * the reducer does the following:
 * 1. if the loadWell action takes place, it will update the state with the initial wells
 * 2. if the updateWell action takes place, will update the well based on its id.
 */
export const wellReducer = createReducer(
  initialWellState,
  on(loadWells, (state, {wells}) => ({
    ...state,
    wells: [...wells]
  })),

  on(updateWell, (state, {well}) => {
    const updatedWells = state.wells.map((w) => (w.id === well.id ? {...w, ...well} : w));
    return {
      ...state,
      wells: updatedWells,
    };
  })
);
