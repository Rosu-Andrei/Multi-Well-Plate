import { createAction, props } from '@ngrx/store';

export const updateWellSample = createAction(
  '[Well] Update Well Sample',
  props<{ wellId: string; sampleId?: string; sampleRole?: string }>()
);
