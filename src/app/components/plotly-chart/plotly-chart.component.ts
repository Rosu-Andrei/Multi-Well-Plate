// plotly-chart.component.ts

import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from '../../store/well.state';
import {updateSelectedRowKeys, updateSelectedWellIds} from '../../store/well.action';
import {selectSelectedRowKeys, selectSelectedWellIds} from "../../store/well.selectors";

@Component({
  selector: 'app-plotly-chart',
  templateUrl: './plotly-chart.component.html',
  styleUrls: ['./plotly-chart.component.css'],
})
export class PlotlyChartComponent implements OnChanges, OnInit {
  @Input() chartData: any[] = [];
  @Output() selectedTraceEmitter = new EventEmitter<string>();

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

  selectedRowKeys: string[] = [];

  constructor(private store: Store<AppState>) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chartData']) {
      this.graph.data = this.chartData || [];
    }
  }

  ngOnInit(): void {
    // Subscribe to selection changes from the store
    this.store.select(selectSelectedRowKeys).subscribe((selectedRowKeys) => {
      this.selectedRowKeys = selectedRowKeys;
      this.highlightTracesByRowKeys(selectedRowKeys);
    });
  }

  // plotly-chart.component.ts

  onChartClick(event: any): void {
    const traceIndex = event.points[0].fullData.index;
    const trace = event.points[0].fullData;
    const fullTraceName = trace.name; // This is the rowKey
    const [wellId, targetName] = fullTraceName.split('_');
    const rowKey = `${wellId}_${targetName}`;

    if (this.selectedRowKeys.includes(rowKey)) {
      // Deselect the trace
      const updatedRowKeys = this.selectedRowKeys.filter((key) => key !== rowKey);
      this.store.dispatch(updateSelectedRowKeys({selectedRowKeys: updatedRowKeys}));
    } else {
      // Select the trace
      const updatedRowKeys = [rowKey];
      this.store.dispatch(updateSelectedRowKeys({selectedRowKeys: updatedRowKeys}));
    }
  }


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

  private highlightTracesByWellIds(selectedWellIds: string[]): void {
    if (selectedWellIds.length === 0) {
      this.resetTraceStyles();
      return;
    }

    this.graph.data.forEach((trace: any) => {
      const [wellId] = trace.name.split('_');
      if (selectedWellIds.includes(wellId)) {
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
