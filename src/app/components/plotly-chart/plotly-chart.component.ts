import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';

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

  /**
   * this represents data that the parent component, in our case the multi-well-plate
   * will send back to the chart component. It represents the data of the chart.
   */
  @Input() chartData: any[] = [];

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
  }
}

