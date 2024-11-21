export interface WellSample {
  sampleId?: string,
  sampleRole?: string
}

export interface WellSamplesState {
  samples: Record<string, WellSample>
}

export const initialState: WellSamplesState = {
  samples: {},
};
