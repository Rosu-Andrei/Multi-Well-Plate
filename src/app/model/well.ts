export interface Well {
  id: string;
  row?: number;
  column?: number;
  sampleRole?: string;
  sampleId?: string;
}


export const mockWells: Well[] = [
  {id: 'F5'},
  {id: 'A1'},
  {id: 'X16'}
];
