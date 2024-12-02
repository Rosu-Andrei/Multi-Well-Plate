import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';

@Component({
  selector: 'app-plotly-chart',
  templateUrl: './plotly-chart.component.html',
  styleUrls: ['./plotly-chart.component.css']
})
export class PlotlyChartComponent implements OnChanges {

  public graph: any = {
    data: [],
    layout: {
      title: 'Plot',
      xaxis: {title: 'X Axis'},
      yaxis: {title: 'Y Axis'},
    },
    config: {
      responsive: true,
    },
  };
  private selectedTraceIndex: number | null = null;
  private traceWellId: string = '';
  /**
   * this represents data that the parent component, in our case the multi-well-plate
   * will send back to the chart component. It represents the data of the chart.
   */
  @Input() chartData: any[] = [];
  @Input() selectedWellIds: string[] = [];
  @Output() selectedWell = new EventEmitter<string>();

  constructor() {
  }

  /**
   * this hook is bound to the @Input() variable and so it is called when a change
   * takes place on the @Input() var. So this means that the chart will update dynamically,
   * based on the changes that took place on the @Input.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes["chartData"]) {
      this.graph.data = this.chartData || [];
    }
    if (changes['selectedWellIds']) {
      this.highlightSelectedTraces();
    }
  }

  /**
   * Handles the click events on the chart and determines which line (trace) was clicked.
   */
  private highlightSelectedTraces(): void {
    this.graph.data.forEach((trace: any) => {
      const wellId = trace.name.split('_')[0]; // Adjusted to parse wellId
      if (this.selectedWellIds.includes(wellId)) {
        // Highlight selected trace
        trace.line.opacity = 1;
        trace.line.width = 4;
      } else {
        // Dim unselected traces
        trace.line.opacity = 0.3;
        trace.line.width = 0.5;
      }
    });
    // Update the graph
    this.graph = { ...this.graph };
  }

  onChartClick(event: any): void {
    const traceName = event.points[0].fullData.name;
    const wellId = traceName.split('_')[0]; // Adjusted to parse wellId
    this.selectedWell.emit(wellId);
  }
}

