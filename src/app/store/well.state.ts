export interface WellSamplesState {
  samples: { [wellId: string]: { sampleId?: string; sampleRole?: string } };
}

export const initialState: WellSamplesState = {
  samples: {},
};
