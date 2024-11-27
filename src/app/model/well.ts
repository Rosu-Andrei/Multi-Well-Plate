export interface Well {
  id: string;
  row?: number;
  column?: number;
  sampleRole?: string;
  sampleId?: string;
  targetName?: string
}


export const mockWells: Well[] = [
  {id: 'F5', sampleId: "56", sampleRole: "Unknown Sample", targetName: "Target1,Target2"},
  {id: 'A1', sampleId: "12", sampleRole: "Negative Process Control", targetName: "Target5,Target4"},
  {id: 'L6', sampleId: "87", sampleRole: "Quantitation Standard", targetName: "Target0,Target12"},
  {id: 'E2', sampleId: "3", sampleRole: "Positive Template Control", targetName: "Target3,Target10"},
  {id: 'C7', sampleId: "1231", sampleRole: "Quantitation Standard", targetName: "Target9,Target11"},
  {id: 'H3', sampleId: "87", sampleRole: "Positive Process Control", targetName: "Target7,Target6"},
  {id: 'B4', sampleId: "57", sampleRole: "Unknown Sample", targetName: "Target2,Target8"}
];

