/**
 * this interface represents the representation of a well and one of its targetName on the chart.
 */
export interface ChartDataItem {
  wellId: string;
  targetName: string;
  x: number[];
  y: number[];
}
