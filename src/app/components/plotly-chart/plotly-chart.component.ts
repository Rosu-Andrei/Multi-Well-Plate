import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {WellSelectionService} from "../../services/well-selection.service";
import {Well} from "../../model/well";

@Component({
  selector: 'app-plotly-chart',
  templateUrl: './plotly-chart.component.html',
  styleUrls: ['./plotly-chart.component.css']
})
export class PlotlyChartComponent implements OnChanges, OnInit {

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
  /**
   * this represents data that the parent component, in our case the multi-well-plate
   * will send back to the chart component. It represents the data of the chart.
   */
  @Input() chartData: any[] = [];
  @Output() selectedTraceEmitter = new EventEmitter<string>();

  constructor(private selectionService: WellSelectionService) {
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

  ngOnInit(): void {
    // Subscribe to plate selection changes
    this.selectionService.plateSelectionSubject.subscribe((selectedWells: Well[]) => {
      const selectedWellIds = selectedWells.map((well) => well.id);
      this.highlightTracesByWellIds(selectedWellIds);
    });

    // Subscribe to table selection changes
    this.selectionService.tableSelectionSubject.subscribe((selectedRowKeys: string[]) => {
      this.highlightTracesByRowKeys(selectedRowKeys);
    });
  }

  /**
   * Handles the click events on the chart and determines which line (trace) was clicked.
   */
  onChartClick(event: any): void {
    /**
     * while each trace (line) is made up of multiple points, for our purpose of knowing which trace
     * was clicked, we only need to access the first one.
     *
     *We then access the index, since every trace has a unique index.
     *
     */
    const traceIndex = event.points[0].fullData.index;
    const trace = event.points[0].fullData;
    const fullTraceName = trace.name;
    const [wellId, targetName] = fullTraceName.split('_');

    const rowKey = `${wellId}_${targetName}`;

    this.selectedTraceEmitter.emit(rowKey);


    /**
     * here we check if the trace is already selected. If yes, this means that the user
     * has clicked on it again while it was selected and that means that we have to unselect it.
     */
    if (this.selectedTraceIndex === traceIndex) {
      this.selectedTraceIndex = null;
    } else {
      this.selectedTraceIndex = traceIndex;
    }

    this.highlightSelectedTrace();
  }

  /**
   * this method is responsible for updating the visual style of all the traces, based on two scenarios:
   * 1. User click on a new trace that is not selected.
   * 2. User clicks on a trace that is already selected, meaning it will deselect it.
   */
  private highlightSelectedTrace(): void {
    this.graph.data.forEach((trace: any, index: number) => {
      /**
       * if it is null, it means that the use has deselected a line and this means that all
       * the traces will go back to their initial values.
       */
      if (this.selectedTraceIndex === null) {
        trace.line.opacity = 1;
        trace.line.width = 2;
        this.selectedTraceEmitter.emit("clearSelection");
      }
      /**
       * else, it means that the user has selected a specific trace, and we modify the one
       * that has the same exact index, all the others will be made to look a bit more fade.
       */
      else if (index === this.selectedTraceIndex) {
        trace.line.opacity = 1;
        trace.line.width = 4;
      } else {
        trace.line.opacity = 0.3;
        trace.line.width = 0.5;
      }
    });

    /**
     * we update the graph with the changes.
     */
    this.graph = {...this.graph};
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

  /**
   * Triggers the chart to update.
   */
  private updateGraph(): void {
    this.graph = {...this.graph};
  }
}
