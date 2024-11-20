import {Well} from "../model/well";

export interface WellState {
  wells: Well[];
}

export const initialWellState: WellState = {
  wells: []
}
