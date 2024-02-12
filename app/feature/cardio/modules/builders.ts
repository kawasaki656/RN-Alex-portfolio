import {
  formatTime,
  getHours,
  getMinutesRemain,
  getSeconds,
  formatHoursMinutesSecondsTime,
  formatShortTime,
} from 'modules/dateHelper';
import {
  TrackingStatsItem,
  Units,
} from 'app/feature/workoutTracker/ui/workoutTrackerPreviewRN/Workout';
import { CardioTypes, levelName, measureName } from './index';
import { CardioStatItem } from './types';
import _ from 'lodash';

const MAX_PACE_VALUE = 3599;
const isAvaialable = (value?: number): boolean => !!value && value > 0;

export const buildTime = (
  {
    time,
  }: {
    time: number;
  },
  units: Units,
  shortTime?: boolean,
): CardioStatItem & { hour: string; min: string; sec: string } | null => {
  if (isAvaialable(time)) {
    return {
      name: measureName.time,
      type: 'time',
      title: 'Time',
      value: !shortTime ? `${formatTime(time)}` : `${formatShortTime(time)}`,
      hour: `${getHours(time)}`,
      min: `${getMinutesRemain(time)}`,
      sec: `${getSeconds(time)}`,
      rawValue: `${time}`,
    };
  }
  return null;
};

export const buildDistance = (
  { distance }: { distance: number },
  units: Units,
): CardioStatItem | null => {
  if (isAvaialable(distance)) {
    return {
      name: measureName.distance,
      title: 'Distance',
      value: `${_.round(distance, 2)} ${units.unitDistance}`,
      type: 'distance',
      rawValue: `${distance}`,
      unit: units.unitDistance,
    };
  }
  return null;
};

export const buildAvgSpeed = (
  { time, distance, exerciseID }: { time: number; distance: number; exerciseID: number },
  units: Units,
): CardioStatItem | null => {
  if (exerciseID === CardioTypes.rowing) return null;
  if (isAvaialable(time) && isAvaialable(distance)) {
    return {
      name: measureName.avgSpeed,
      type: 'speed',
      title: 'Avg speed',
      value: `${_.floor(distance / (time / 3600), 2)} ${units.unitDistance}/h`,
      rawValue: `${_.floor(distance / (time / 3600), 2)}`,
      unit: `${units.unitDistance}/h`,
    };
  }
  return null;
};

export const buildAvgPace = (
  { time, distance, exerciseID }: { time: number; distance: number; exerciseID: number },
  units: Units,
): CardioStatItem | null => {
  if (isAvaialable(time) && isAvaialable(distance)) {
    const paceValue = exerciseID === CardioTypes.rowing ? (time / distance) * 500 : time / distance;
    const specialUnit = exerciseID === CardioTypes.rowing ? '/500 m' : null;
    const valueUnit = specialUnit ? specialUnit : `/${units.unitDistance}`;
    const rawValue =
      paceValue <= MAX_PACE_VALUE ? formatHoursMinutesSecondsTime(_.floor(paceValue)) : '-';

    return {
      name: measureName.avgPace,
      type: 'speed',
      title: 'Avg pace',
      value: `${rawValue} ${valueUnit}`,
      rawValue,
      specialUnit,
      unit: `/${units.unitDistance}`,
    };
  }
  return null;
};

export const buildSpeed = ({ speed }: { speed: number }, units: Units): CardioStatItem | null => {
  if (speed) {
    return {
      name: measureName.maxSpeed,
      type: 'speed',
      title: 'Max speed',
      value: `${speed} ${units.unitDistance}/h`,
      rawValue: `${speed}`,
      unit: `${units.unitDistance}/h`,
    };
  }
  return null;
};

export const buildLevel = ({
  level,
  exerciseID,
}: {
  level: number;
  exerciseID: number;
}): CardioStatItem | null => {
  if (level) {
    return {
      name: measureName.level,
      type: 'level',
      title: levelName(exerciseID),
      value: `${level}`,
      rawValue: `${level}`,
    };
  }
  return null;
};

export const buildIncline = ({ level }: { level: number }): CardioStatItem | null => {
  if (level) {
    return {
      name: measureName.incline,
      type: 'level',
      title: 'Incline',
      value: `${level}`,
      rawValue: `${level}`,
    };
  }
  return null;
};

export const buildResistance = ({ level }: { level: number }): CardioStatItem | null => {
  if (level) {
    return {
      name: measureName.resistance,
      type: 'level',
      title: 'Resistance',
      value: `${level}`,
      rawValue: `${level}`,
    };
  }
  return null;
};

export const buildCalories = ({
  activeCalories,
  calories,
}: {
  activeCalories: number;
  calories: number;
}): CardioStatItem | null => {
  if (calories && !activeCalories) {
    return {
      name: measureName.calories,
      type: 'calories',
      title: 'Total calories',
      value: `${_.floor(calories)}`,
      rawValue: `${_.floor(calories)}`,
    };
  }
  return null;
};

export const buildExerciseDetailsCalories = (data: {
  activeCalories: number;
  calories: number;
}): CardioStatItem | null => {
  const result = buildCalories(data);

  if (result) {
    return {
      ...result,
      title: 'Total cal',
    };
  }

  return null;
};

export const buildMaxHeartRate = ({ maxHeartRate }: TrackingStatsItem): CardioStatItem | null => {
  if (maxHeartRate) {
    return {
      name: measureName.maxHeartRate,
      type: 'maxHeartRate',
      title: 'Max heart rate',
      value: `${maxHeartRate}`,
      rawValue: `${maxHeartRate}`,
    };
  }
  return null;
};

export const buildAvgHeartRate = ({ avgHeartRate }: TrackingStatsItem): CardioStatItem | null => {
  if (avgHeartRate) {
    return {
      name: measureName.avgHeartRate,
      type: 'avgHeartRate',
      title: 'Avg heart rate',
      value: `${avgHeartRate}`,
      rawValue: `${avgHeartRate}`,
    };
  }
  return null;
};

export const buildTotalCaloriese = ({
  activeCalories,
  calories,
}: TrackingStatsItem): CardioStatItem | null => {
  if (calories && activeCalories) {
    return {
      name: measureName.activeCalories,
      type: 'activeCalories',
      title: 'Total calories',
      value: `${_.floor(calories)}`,
      rawValue: `${_.floor(calories)}`,
    };
  }
  return null;
};

export const buildExerciseDetailsTotalCalories = (
  data: TrackingStatsItem,
): CardioStatItem | null => {
  const result = buildTotalCaloriese(data);

  if (result) {
    return {
      ...result,
      title: 'Total cal',
    };
  }

  return null;
};

export const buildActiveCaloriese = ({
  activeCalories,
}: TrackingStatsItem): CardioStatItem | null => {
  if (activeCalories) {
    return {
      name: measureName.activeCalories,
      type: 'activeCalories',
      title: 'Active calories',
      value: `${_.floor(activeCalories)}`,
      rawValue: `${_.floor(activeCalories)}`,
    };
  }
  return null;
};

export const buildExerciseDetailsActiveCalories = (
  data: TrackingStatsItem,
): CardioStatItem | null => {
  const result = buildActiveCaloriese(data);

  if (result) {
    return {
      ...result,
      title: 'Active cal',
    };
  }

  return null;
};
