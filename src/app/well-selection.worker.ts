/**
 *  The web worker is used to handle a part of the selection logic in a background thread
 *  to prevent blocking the main thread. This means that the UI remains responsive (doesn't freeze)
 */

import {Well} from "./model/well";

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

let wells: Well[][] = [];
/**
 * The selectedWellIds are the main structure used by the web worker. It will contain
 * the ids of every well that are to be marked as selected. (it is repopulated at each lookup)
 */
let selectedWellIds: Set<string> = new Set();
let lastSelectedWell: Well | null = null;

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
    case 'updateFromTable':
      console.log("Nothing");
      break;
    default:
      console.error('Unknown message type:', message.type);
  }
});

function toggleWellSelection(payload: any): void {
  const {ctrlPressed, shiftPressed, well} = payload;

  if (ctrlPressed && shiftPressed && lastSelectedWell) {
    const newSelection = getWellsInRange(lastSelectedWell, well);
    for (const well of newSelection) {
      selectedWellIds.add(well.id);
    }
  } else if (ctrlPressed) {
    if (selectedWellIds.has(well.id)) {
      selectedWellIds.delete(well.id);
    } else {
      selectedWellIds.add(well.id);
    }
    lastSelectedWell = well;
  } else {
    selectedWellIds.clear();
    selectedWellIds.add(well.id);
    lastSelectedWell = well;
  }
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
    const allSelected = rowWells.every((well) => selectedWellIds.has(well.id));
    if (allSelected) {
      rowWells.forEach((well) => selectedWellIds.delete(well.id));
    } else {
      rowWells.forEach((well) => selectedWellIds.add(well.id));
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
}

/**
 * this method is called for every case in the switch. It sends back to the main thread the Set that contains
 * all the wells id for selection.
 */
function postSelectionUpdate(): void {
  postMessage({type: 'selectionUpdate', payload: Array.from(selectedWellIds)});
}
