/**
 * structure for the sampleId and sampleRole
 */
export interface WellSample {
  sampleId?: string;
  sampleRole?: string;
  targetNames?: string[];
}

/**
 * this represents a sample in the state store. The key is the wellId, whose values represent
 * the sampleId and sampleRole for that respective well
 */
export interface WellSamplesState {
  samples: Record<string, WellSample>
}

/**
 * a constant that represents the initial state, when the application first launches.
 */
export const initialState: WellSamplesState = {
  samples: {},
};

export interface WellSelectionState {
  selectedWellIds: string[];
  selectedRowKeys: string[];
}

export interface AppState {
  wellSamples: WellSamplesState;
  wellSelection: WellSelectionState;
}

export const initialSelectionState: WellSelectionState = {
  selectedWellIds: [],
  selectedRowKeys: [],
};
