import {createAction, props} from "@ngrx/store";
import {Well} from "../model/well";

/**
 * Loads the initial wells into the state
 */
export const loadWells = createAction("[Well] Load Wells", props<{ wells: Well[] }>());
/**
 * will update a single well's sampleId or sampleRole.
 */
export const updateWell = createAction("[Well] Update Well", props<{ well: Well }>());
