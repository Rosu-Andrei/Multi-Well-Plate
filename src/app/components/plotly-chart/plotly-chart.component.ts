import {Component, Input, OnChanges, OnInit, SimpleChanges,} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from '../../store/well.state';
import {selectSelectedRowKeys} from "../../store/well.selectors";
import {WellSelectionService} from "../../services/well-selection.service";

@Component({
  selector: 'app-plotly-chart',
  templateUrl: './plotly-chart.component.html',
  styleUrls: ['./plotly-chart.component.css'],
})
export class PlotlyChartComponent implements OnChanges, OnInit {
  /**
   * the chartData is marked as an @Input. The chart component receives this chartData from the plate component,
   * after the load of the mockData takes place.
   */
  @Input() chartData: any[] = [];

  /**
   * this graph represents all the data source for the chart.
   */
  public graph: any = {
    data: [],
    layout: {
      title: 'Chart',
      xaxis: {title: 'X Axis'},
      yaxis: {title: 'Y Axis'},
    },
    config: {
      responsive: true,
    },
  };

  selectedRowKeys: string[] = [];

  constructor(private store: Store<AppState>, private selectionService: WellSelectionService) {
  }

  /**
   * we use the onChanges hook to update the graph.data whenever the charData is updated.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chartData']) {
      this.graph.data = this.chartData || [];
    }
  }

  /**
   * we subscribe to the part of the store that indicates to the selectedRowKeys so that whenever a selection takes
   * place in the other components (table or plate), the appropriate traces are selected in the chart as well.
   */
  ngOnInit(): void {
    this.store.select(selectSelectedRowKeys).subscribe((selectedRowKeys) => {
      this.selectedRowKeys = selectedRowKeys; // update the property that keeps track of the current selected traces.
      this.highlightTracesByRowKeys(selectedRowKeys);
    });
  }

  /**
   * the method is called when the user clicks on a trace. Through the event we extract the name of the trace,
   * which is essentially the rowKey and we send it to the selection service.
   */
  onChartClick(event: any): void {
    const traceName: string = event.points[0].fullData.name;
    this.selectionService.tracesFromChart(traceName, this.selectedRowKeys);
  }

  /**
   * this method is called whenever a selection takes place in any of the components. It receives the selectedRowKeys,
   * and based on them, it highlights the according traces.
   */
  private highlightTracesByRowKeys(selectedRowKeys: string[]): void {
    if (selectedRowKeys.length === 0) {
      this.resetTraceStyles();
      return;
    }

    this.graph.data.forEach((trace: any) => {
      if (selectedRowKeys.includes(trace.name)) {
        // Highlight trace
        trace.line.opacity = 1;
        trace.line.width = 4;
      } else {
        // Dim trace
        trace.line.opacity = 0.3;
        trace.line.width = 0.5;
      }
    });
    this.updateGraph();
  }

  private resetTraceStyles(): void {
    this.graph.data.forEach((trace: any) => {
      trace.line.opacity = 1;
      trace.line.width = 2;
    });
    this.updateGraph();
  }

  private updateGraph(): void {
    this.graph = {...this.graph};
  }
}
