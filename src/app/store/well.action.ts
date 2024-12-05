import {createAction, props} from '@ngrx/store';
import {WellSample} from "./well.state";

/**
 * represents the action of a user. It is the update of a well, whereby update in this context
 * we understand the modification of either the sampleId or sampleRole or both for a specific well.
 *
 * The props<{}> element represents the payload of our action, in our case
 * the wellId of the well that is modified and the changes that have been applied on it.
 */
export const updateWellSample = createAction(
  '[Well] Update Well Sample',
  props<{ wellId: string; changes: Partial<WellSample> }>()
);

export const updateSelectedWellIds = createAction(
  '[Well Selection] Update Selected Well Ids',
  props<{ selectedWellIds: string[] }>()
);

export const updateSelectedRowKeys = createAction(
  '[Well Selection] Update Selected Row Keys',
  props<{ selectedRowKeys: string[] }>()
);

export const clearSelection = createAction(
  '[Well Selection] Clear Selection'
);
