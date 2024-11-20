export interface Well {
  id: string;
  row?: number;
  column?: number;
  sampleRole?: string;
  sampleId?: string;
}


export const mockWells: Well[] = [
  {id: 'F5', sampleId: "56", sampleRole: "Unknown Sample"},
  {id: 'A1', sampleId: "12", sampleRole: "Unknown Sample"},
  {id: 'X16',sampleId: "22", sampleRole: "Unknown Sample"}
];
