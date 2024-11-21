import {createAction, props} from '@ngrx/store';
import {WellSample} from "./well.state";

export const updateWellSample = createAction(
  '[Well] Update Well Sample',
  props<{ wellId: string; changes: Partial<WellSample> }>()
);
