/**
 *  The web worker is used to handle a part of the selection logic in a background thread
 *  to prevent blocking the main thread. This means that the UI remains responsive (doesn't freeze).
 *
 *  The web worker handles the heavy computation operations that are required for all the selection types.
 */

import {Well} from "./model/well";
import {WellTableRow} from "./components/plate-table/plate-table.component";

/**
 * this interface defines the structure of the messages that are exchanged between the main thread and the worker thread.
 *
 * The "type" will say what methods will be called, whereas the payload will contain the parameters of each method identified
 * by the type ( which can vary, this is why has "any" )
 */
interface WorkerMessage {
  type: string;
  payload: any;
}

let wells: Well[][] = []; // acts as a representation of the current well plate displayed in the web page.
/**
 * The selectedWellIds are the main structure used by the web worker. It will contain
 * the ids of every well that are to be marked as selected. (it is repopulated at each lookup)
 */
let selectedWellIds: Set<string> = new Set();
let lastSelectedWell: Well | null = null; // it is used for the box selection logic (the one with ctrl + shift).
/**
 * this one is going to hold the rowKeys used by the chart and table component
 */
let selectedRowKeys: Set<string> = new Set();

/**
 * This is the method that listens for messages coming from the main thread.
 * Based on the message "type", the appropriate function is called to handle the desired selection logic,
 * and then send back the updates to the main thread.
 */
addEventListener('message', ({data}) => {
  const message: WorkerMessage = data;

  switch (message.type) {
    /**
     * gets the initial well matrix
     */
    case 'initialize':
      wells = message.payload.wells;
      selectedWellIds.clear();
      lastSelectedWell = null;
      break;
    /**
     * handles the selection and deselection of individual wells. Also handles
     * the ctrl combination and also ctrl + shift combination.
     */
    case 'toggleWellSelection':
      toggleWellSelection(message.payload);
      postSelectionUpdate();
      break;
    /**
     * handles the selection of a single or multiple wells by clicking on the row headers.
     */
    case 'toggleRowSelection':
      toggleRowSelection(message.payload);
      postSelectionUpdate();
      break;
    /**
     * handles the selection of a single or multiple wells by clicking on the column headers.
     */
    case 'toggleColumnSelection':
      toggleColumnSelection(message.payload);
      postSelectionUpdate();
      break;
    case 'clearSelection':
      /**
       * clears the Set that contains the ids of the wells we want to select.
       */
      clearSelection();
      postSelectionUpdate();
      break;
    case 'rowFromTables':
      rowFromTable(message.payload);
      postRowKeyUpdate();
      break;
    case 'tracesFromChart':
      tracesFromChart(message.payload);
      postRowKeyUpdate();
      break;
    default:
      console.error('Unknown message type:', message.type);
  }
});

/**
 * this method is used when the user clicks a well on the plate. It receives the payload from the
 * selectionService, and based on it, will add the appropriate wellId in the "selectedWellIds" Set
 */
function toggleWellSelection(payload: any): void {
  const {ctrlPressed, shiftPressed, well} = payload; // extract the data from the main thread

  /**
   * we check if we are in the box selection case. If so, we create the well[] that represents
   * all the wells selected in the box. We then add all of those wellIds to the Set.
   */
  if (ctrlPressed && shiftPressed && lastSelectedWell) {
    const newSelection = getWellsInRange(lastSelectedWell, well);
    for (const wellInRange of newSelection) {
      selectedWellIds.add(wellInRange.id);
    }
  } else if (ctrlPressed) {
    if (selectedWellIds.has(well.id)) {  // in this case, if the wellId exists in the Set, it means the user wants to deselect it.
      selectedWellIds.delete(well.id); // we remove the wellId from the Set (deselection)
    } else {
      selectedWellIds.add(well.id); // we are in the case of multi selection, and we add the wellId to the Set.
    }
    // Only update lastSelectedWell if shift is not pressed
    if (!shiftPressed) {
      lastSelectedWell = well;
    }
    /**
     * in this case it means we are in the case of a single well that has been selected,
     * with no keyboard combination, just mouse click.
     */
  } else {
    selectedWellIds.clear();
    selectedWellIds.add(well.id);
    lastSelectedWell = well;
  }
  /**
   * after the "selectedWellsId" Set has been populated with the appropriate wellIds, we pass the Set as
   * an Array back to the main thread.
   */
}


function getWellsInRange(startWell: Well, endWell: Well): Well[] {
  if (
    startWell.row === undefined ||
    startWell.column === undefined ||
    endWell.row === undefined ||
    endWell.column === undefined
  ) {
    return [];
  }

  const startRow = startWell.row;
  const endRow = endWell.row;
  const startCol = startWell.column;
  const endCol = endWell.column;

  const minRow = Math.min(startRow, endRow);
  const maxRow = Math.max(startRow, endRow);
  const minCol = Math.min(startCol, endCol);
  const maxCol = Math.max(startCol, endCol);

  const wellsInRange: Well[] = [];

  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      if (wells[row] && wells[row][col]) {
        wellsInRange.push(wells[row][col]);
      }
    }
  }
  return wellsInRange;
}

function toggleRowSelection(payload: any): void {
  const {ctrlPressed, rowIndex} = payload;
  const rowWells = wells[rowIndex];

  if (!rowWells) return;

  if (ctrlPressed) {
    // we check if all the wells in that row are already selected
    const allSelected = rowWells.every((well) => selectedWellIds.has(well.id));
    if (allSelected) {
      rowWells.forEach((well) => selectedWellIds.delete(well.id)); // deselect
    } else {
      rowWells.forEach((well) => selectedWellIds.add(well.id)); // select
    }
  } else {
    selectedWellIds.clear();
    rowWells.forEach((well) => selectedWellIds.add(well.id));
  }
}

function toggleColumnSelection(payload: any): void {
  const {ctrlPressed, columnIndex} = payload;
  const colWells = wells.map((row) => row[columnIndex]).filter(Boolean);

  if (ctrlPressed) {
    const allSelected = colWells.every((well) => selectedWellIds.has(well.id));
    if (allSelected) {
      colWells.forEach((well) => selectedWellIds.delete(well.id));
    } else {
      colWells.forEach((well) => selectedWellIds.add(well.id));
    }
  } else {
    selectedWellIds.clear();
    colWells.forEach((well) => selectedWellIds.add(well.id));
  }
}

function clearSelection(): void {
  selectedWellIds.clear();
  lastSelectedWell = null;
  selectedRowKeys.clear();
}

/**
 * It sends back to the main thread the Set that contains all the wellIds for selection.
 */
function postSelectionUpdate(): void {
  postMessage({type: 'selectionUpdate', payload: Array.from(selectedWellIds)});
}

function postRowKeyUpdate(): void {
  postMessage({type: "rowFromTable", payload: Array.from(selectedRowKeys)});
}

/**
 * the method receives the selected rows from the table. It extracts the rowKey from the selected
 * array, and it adds it to the local storage of rowKeys that will be sent back to the main thread.
 */
function rowFromTable(payload: WellTableRow[]) {
  clearSelection();
  const selectedRowKeysFromTable = payload.map(well => well.rowKey);
  selectedRowKeysFromTable.forEach(rowKey => {
    selectedRowKeys.add(rowKey);
  });
}

/**
 * this function is called when the user selects or deselects a trace in the chart.
 * It updates the selectedRowKey Set and sends it back to the main thread.
 */
function tracesFromChart(traceName: string): void {
  const [wellId, targetName] = traceName.split('_');
  const rowKey = `${wellId}_${targetName}`;
  let updatedRowKeys: string[];
  let selectedRowKeysArray = Array.from(selectedRowKeys);

  if (selectedRowKeys.has(rowKey)) {
    updatedRowKeys = selectedRowKeysArray.filter((key) => key !== rowKey); // deselect
  } else {
    updatedRowKeys = [...selectedRowKeysArray, rowKey]; // add newly selected trace
  }
  selectedRowKeys = new Set(updatedRowKeys);
}



