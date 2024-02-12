import { DailyCardio } from '../modules/types';


export type TimeLineCardioActivity = {
  id: string,
}

export type CardioStore = {
  cardioById: Record<string, DailyCardio>,
  inProgress: boolean,
  brokenRecords: unknown,
  showSummary: boolean,
  error: null | string,
  lastCardioActivities: Array<string>,
}
