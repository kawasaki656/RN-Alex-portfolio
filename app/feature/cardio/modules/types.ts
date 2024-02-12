import { TargetDetail } from 'app/feature/workoutTracker/ui/workoutTrackerPreviewRN/Workout';

export type CardioStatItem = {
  name: string,
  title: string,
  type: string,
  value: string,
  rawValue: string,
  specialUnit?: string | null,
  unit?: string,
};

export type CardioStats = {
  distance: number | null,
  time:  number | null,
  level:  number | null,
  speed:  number | null,
  calories:  number | null,
  activeCalories?:  number | null,
  maxHeartRate?:  number | null,
  avgHeartRate?:  number | null,
};

export type DailyCardio = {
  id: number,
  name: string,
  date: string,
  startTime: string,
  endTime: string,
  target: string,
  targetDetail: TargetDetail,
  exerciseID: number,
  status: 'scheduled' | 'checkedin' | 'tracked';
  numberOfComments: number,
  notes: number,
  dateUpdated?: string,
  fromProgram: boolean,
} & CardioStats;
