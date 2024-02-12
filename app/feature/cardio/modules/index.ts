import _ from 'lodash';
import { workoutStatus } from 'app/feature/workoutTracker/modules';
import icons from 'assets/images/status';
import {
  formatTime,
  formatShortTime,
  getHours,
  getMinutesRemain,
  getSeconds,
  getMinutes,
} from 'modules/dateHelper';
import Units, { UnitsType } from 'modules/units';
import cardioExercises, { filledExerciseIcons } from 'assets/images/cardioExercises';
import cardioExercisesIcons from 'assets/images/cardioExercisesIcons';
import { dailyItemStatus } from 'ui/constants/strings';
import { CardioTypes as CardioTypesTS } from 'app/feature/cardio/modules/CardioModule';
import { Stats } from 'feature/workoutTracker/ui/workoutTrackerPreviewRN/Workout';

export const CardioTypes = CardioTypesTS;

const exerciseStatuses = {
  [workoutStatus.scheduled]: dailyItemStatus.scheduled,
  [workoutStatus.checkedIn]: dailyItemStatus.completed,
  [workoutStatus.tracked]: dailyItemStatus.tracked,
};

export const trackedCardio = {
  cardio: 'Cardio',
  statsBlock: 'StatsBlock',
};

export const zones = {
  1: [50, 60],
  2: [60, 70],
  3: [70, 80],
  4: [80, 90],
  5: [90, 100],
};

export const DEFAULT_ZONE = 1;

export const TargetTypes = {
  DISTANCE_TYPE: 1,
  DISTANCE_HEART_TYPE: 20,
  TIME_TYPE: 2,
  TIME_HEART_TYPE: 30,
  TEXT_TYPE: 10,
  NONE_TYPE: 0,
  COMPLETE_WITH_NO_TARGET: 99,
} as const;

export const getTargetDetails = (pastScheduled, isTrainer) => [
  {
    title: 'Distance',
    targetDetailType: TargetTypes.DISTANCE_TYPE,
  },
  {
    title: 'Time',
    targetDetailType: TargetTypes.TIME_TYPE,
  },
  {
    title: 'Type my own',
    hide: !isTrainer,
    targetDetailType: TargetTypes.TEXT_TYPE,
  },
  {
    title: 'Complete with no target',
    hide: !pastScheduled,
    targetDetailType: TargetTypes.COMPLETE_WITH_NO_TARGET,
  },
  {
    title: 'None',
    targetDetailType: TargetTypes.NONE_TYPE,
  },
];

export const getTimeCardioTargetDetails = pastScheduled => [
  {
    title: 'Time',
    targetDetailType: TargetTypes.TIME_TYPE,
  },
  {
    title: 'Complete with no target',
    hide: !pastScheduled,
    targetDetailType: TargetTypes.COMPLETE_WITH_NO_TARGET,
  },
  {
    title: 'None',
    targetDetailType: TargetTypes.NONE_TYPE,
  },
];

export const getTimeTextNoneCardioTargetDetails = pastScheduled => [
  {
    title: 'Time',
    targetDetailType: TargetTypes.TIME_TYPE,
  },
  {
    title: 'Type my own',
    targetDetailType: TargetTypes.TEXT_TYPE,
  },
  {
    title: 'Complete with no target',
    hide: !pastScheduled,
    targetDetailType: TargetTypes.COMPLETE_WITH_NO_TARGET,
  },
  {
    title: 'None',
    targetDetailType: TargetTypes.NONE_TYPE,
  },
];

export const getIntervalTargetDetails = pastScheduled => [
  {
    title: 'Type my own',
    targetDetailType: TargetTypes.TEXT_TYPE,
  },
  {
    title: 'Complete with no target',
    hide: !pastScheduled,
    targetDetailType: TargetTypes.COMPLETE_WITH_NO_TARGET,
  },
  {
    title: 'None',
    targetDetailType: TargetTypes.NONE_TYPE,
  },
];

export const getExerciseStatus = status => exerciseStatuses[status];
export const getExerciseImage = exerciseId => cardioExercises[exerciseId];
export const getExerciseFilledImage = exerciseId => filledExerciseIcons[exerciseId];
export const getExerciseIcon = exerciseId => cardioExercisesIcons[exerciseId];
export const getStatusImage = status => {
  switch (status) {
    case workoutStatus.scheduled:
      return icons.icon;
    case workoutStatus.checkedIn:
    case workoutStatus.tracked:
      return icons.trackedIcon;
    default:
      return icons.icon;
  }
};

const parseTime = time => {
  const timeFormated = parseFloat(time);
  if (_.isNaN(time) || _.isNaN(timeFormated)) {
    return 0;
  }
  return timeFormated;
};

export const convertTimeForRequest = (hours, minutes, seconds) =>
  `${Math.round(parseTime(hours) * 3600 + parseTime(minutes) * 60 + parseTime(seconds))}`;

export const prepareDataForRequest = obj => {
  const keys = Object.keys(obj);
  return keys.reduce((acc, currentKey) => {
    if (obj[currentKey]) {
      return {
        ...acc,
        [currentKey]: obj[currentKey],
      };
    }

    return {
      ...acc,
      [currentKey]: null,
    };
  }, {});
};

const calculateHeartRate = age => 220 - age;

export const getBpm = (age, zone) => {
  if (age && zone) {
    const heartRate = calculateHeartRate(age);
    const bpm = zones[zone].map(percent => _.round((percent * heartRate) / 100));
    const joinedBpm = bpm.join(' - ');
    return `Zone ${zone} (${joinedBpm} bpm)`;
  } else if (!age && zone) {
    const percentages = zones[zone].join('-');
    return `Zone ${zone} (${percentages} max HR)`;
  }

  return null;
};

export const getBpmDiapazon = (age, zone) => {
  if (age && zone) {
    const heartRate = calculateHeartRate(age);
    const bpm = zones[zone].map(percent => _.round((percent * heartRate) / 100));
    return bpm;
  }
  return null;
};

export const TimeCardioTypes = [
  CardioTypesTS.americanFootball,
  CardioTypesTS.australianFootball,
  CardioTypesTS.badminton,
  CardioTypesTS.basketball,
  CardioTypesTS.baseball,
  CardioTypesTS.cricket,
  CardioTypesTS.crossFit,
  CardioTypesTS.fitnessClass,
  CardioTypesTS.hiking,
  CardioTypesTS.hockey,
  CardioTypesTS.jumpRope,
  CardioTypesTS.paddling,
  CardioTypesTS.pilates,
  CardioTypesTS.rugby,
  CardioTypesTS.skiing,
  CardioTypesTS.snowboarding,
  CardioTypesTS.squash,
  CardioTypesTS.softball,
  CardioTypesTS.soccer,
  CardioTypesTS.tennis,
  CardioTypesTS.tableTennis,
  CardioTypesTS.yoga,
  CardioTypesTS.volleyball,
  CardioTypesTS.general,
  CardioTypesTS.stair,
  CardioTypesTS.swimming,
  CardioTypes.dancing,
  CardioTypes.hiit,
];

export const isSystemCardio = id => Object.values(CardioTypes).indexOf(id) >= 0;
export const isTimeCardio = id => TimeCardioTypes.indexOf(id) >= 0;

/**
 * Get the display units for cardio target which defaults to the
 * units saved to the cardio target itself instead of the signed
 * in units. (e.g. Trainer saves target in miles, clients units are km,
 * target should show original units)
 * @param {Object} stats Cardio target including exerciseID
 * @param {Object} units Signed in user units
 */
export const getTargetUnits = (stats, units) => {
  const fallBackUnit = _.get(stats, 'distanceUnit', units.distance);
  const distance = _.get(stats, 'targetDetail.distanceUnit', fallBackUnit);
  return {
    ...units,
    distance,
    unitDistance: distance,
  };
};

// Convert Rowing only use meter
export const formatUnitsByExercise = (units, exerciseID) => {
  switch (exerciseID) {
    case CardioTypes.rowing:
      return { ...units, unitDistance: Units.METRIC_UNITS.unitBaseDistance };
    default:
      return units;
  }
};

// Get cardio units from state
export const cardioUnits = (state, exerciseID) => {
  const units = Units.unitsShort(state);
  return formatUnitsByExercise(units, exerciseID);
};

// Convert Rowing display value in meter from user default unit
export const cardioStats = (
  stats: Stats & { exerciseID: number },
  userUnits: UnitsType,
): Stats & { exerciseID: number } => {
  const { exerciseID } = stats;
  const { unitDistance } = userUnits;
  const isMetric = unitDistance === Units.METRIC_UNITS.unitDistance;

  switch (exerciseID) {
    case CardioTypes.rowing: {
      const formattedDistance = _.toNumber(stats.distance);
      if (!formattedDistance || _.isNaN(formattedDistance)) return stats;

      return {
        ...stats,
        distance: _.round(
          isMetric
            ? Units.kmToMeter(formattedDistance)
            : Units.kmToMeter(Units.milesToKM(formattedDistance)),
        ),
      };
    }
    default:
      return stats;
  }
};

export const floatNumberValidator = (value: string): boolean => {
  const regexp = /^[0-9]*[.|,]?\d*$/;
  return regexp.test(value);
};

export const replaceComaWithDot = (value: string): string => value.replace(',', '.');

export const cardioDistanceStat = (
  distance: string,
  units: UnitsType,
  exerciseID: number,
): string => {
  const formattedStat = cardioStats({ distance, exerciseID }, units);

  return _.toString(formattedStat.distance);
};

export const convertDistance = (distance, { unitDistance }, exerciseID) => {
  const isMetric = unitDistance === Units.METRIC_UNITS.unitDistance;
  if (exerciseID === CardioTypes.rowing) {
    const formattedDistance = _.toNumber(distance);
    if (!formattedDistance || _.isNaN(formattedDistance)) return '';
    const convertedDistance = isMetric
      ? Units.meterToKM(parseFloat(formattedDistance))
      : Units.meterToKM(Units.kmToMiles(parseFloat(formattedDistance)));
    return _.toString(convertedDistance);
  }

  return distance;
};

export const cardioActivityNames = {
  [CardioTypesTS.running]: 'Run',
  [CardioTypesTS.walking]: 'Walk',
  [CardioTypesTS.cycling]: 'Cycle',
  [CardioTypesTS.elliptical]: 'Exercise',
  [CardioTypesTS.rowing]: 'Row',
  [CardioTypesTS.stair]: 'Exercise',
  [CardioTypesTS.general]: 'Exercise',
  [CardioTypesTS.pilates]: 'Exercise',
  [CardioTypesTS.yoga]: 'Practice',
  [CardioTypesTS.tennis]: 'Play',
  [CardioTypesTS.basketball]: 'Play',
  [CardioTypesTS.volleyball]: 'Play',
  [CardioTypesTS.baseball]: 'Play',
  [CardioTypesTS.soccer]: 'Play',
  [CardioTypesTS.americanFootball]: 'Play',
  [CardioTypesTS.australianFootball]: 'Play',
  [CardioTypesTS.badminton]: 'Play',
  [CardioTypesTS.cricket]: 'Play',
  [CardioTypesTS.crossFit]: 'Exercise',
  [CardioTypesTS.fitnessClass]: 'Exercise',
  [CardioTypesTS.hiking]: 'Hike',
  [CardioTypesTS.hockey]: 'Play',
  [CardioTypesTS.jumpRope]: 'Jump rope',
  [CardioTypesTS.paddling]: 'Paddle',
  [CardioTypesTS.rugby]: 'Play',
  [CardioTypesTS.skiing]: 'Ski',
  [CardioTypesTS.snowboarding]: 'Snowboard',
  [CardioTypesTS.squash]: 'Play',
  [CardioTypesTS.softball]: 'Play',
  [CardioTypesTS.tableTennis]: 'Play',
  [CardioTypesTS.dancing]: 'Dance',
  [CardioTypes.swimming]: 'Swim',
};

export const cardioActivityTitleNames = {
  [CardioTypesTS.running]: 'run',
  [CardioTypesTS.walking]: 'walk',
  [CardioTypesTS.elliptical]: 'elliptical trainer session',
  [CardioTypesTS.cycling]: 'bike ride',
  [CardioTypesTS.rowing]: 'rowing session',
  [CardioTypesTS.stair]: 'stair climbing session',
  [CardioTypesTS.general]: 'exercise session',
  [CardioTypesTS.pilates]: 'pilates session',
  [CardioTypesTS.yoga]: 'yoga session',
  [CardioTypesTS.tennis]: 'tennis game',
  [CardioTypesTS.basketball]: 'basketball game',
  [CardioTypesTS.volleyball]: 'volleyball game',
  [CardioTypesTS.soccer]: 'soccer game',
  [CardioTypesTS.americanFootball]: 'American football game',
  [CardioTypesTS.australianFootball]: 'Australian football game',
  [CardioTypesTS.badminton]: 'badminton game',
  [CardioTypesTS.baseball]: 'baseball game',
  [CardioTypesTS.cricket]: 'cricket game',
  [CardioTypesTS.crossFit]: 'CrossFit session',
  [CardioTypesTS.fitnessClass]: 'fitness class',
  [CardioTypesTS.hiking]: 'hike',
  [CardioTypesTS.hockey]: 'hockey game',
  [CardioTypesTS.jumpRope]: 'jump rope session',
  [CardioTypesTS.rugby]: 'rugby game',
  [CardioTypesTS.skiing]: 'skiing session',
  [CardioTypesTS.snowboarding]: 'snowboarding session',
  [CardioTypesTS.squash]: 'squash game',
  [CardioTypesTS.softball]: 'softball game',
  [CardioTypesTS.tableTennis]: 'table tennis game',
  [CardioTypesTS.paddling]: 'paddling session',
  [CardioTypesTS.swimming]: 'swim',
  [CardioTypes.dancing]: 'dance',
  [CardioTypes.hiit]: 'HIIT session',
};

export const cardioActivityVerbs = {
  [CardioTypesTS.running]: 'ran',
  [CardioTypesTS.walking]: 'walked',
  [CardioTypesTS.elliptical]: 'exercised',
  [CardioTypesTS.cycling]: 'cycled',
  [CardioTypesTS.rowing]: 'rowed',
  [CardioTypesTS.stair]: 'exercised',
  [CardioTypesTS.general]: 'exercised',
  [CardioTypesTS.pilates]: 'exercised',
  [CardioTypesTS.yoga]: 'practised',
  [CardioTypesTS.tennis]: 'played',
  [CardioTypesTS.basketball]: 'played',
  [CardioTypesTS.volleyball]: 'played',
  [CardioTypesTS.soccer]: 'played',
  [CardioTypesTS.americanFootball]: 'played',
  [CardioTypesTS.australianFootball]: 'played',
  [CardioTypesTS.badminton]: 'played',
  [CardioTypesTS.baseball]: 'played',
  [CardioTypesTS.cricket]: 'played',
  [CardioTypesTS.crossFit]: 'exercised',
  [CardioTypesTS.fitnessClass]: 'exercised',
  [CardioTypesTS.hiking]: 'hiked',
  [CardioTypesTS.hockey]: 'played',
  [CardioTypesTS.jumpRope]: 'jumped rope',
  [CardioTypesTS.rugby]: 'played',
  [CardioTypesTS.skiing]: 'skied',
  [CardioTypesTS.snowboarding]: 'snowboarded',
  [CardioTypesTS.squash]: 'played',
  [CardioTypesTS.softball]: 'played',
  [CardioTypesTS.tableTennis]: 'played',
  [CardioTypesTS.paddling]: 'paddled',
  [CardioTypesTS.swimming]: 'swam',
  [CardioTypesTS.dancing]: 'danced',
  [CardioTypesTS.hiit]: 'exercised',
};

export const cardioNames = {
  [CardioTypesTS.running]: 'running',
  [CardioTypesTS.walking]: 'walking',
  [CardioTypesTS.elliptical]: 'elliptical',
  [CardioTypesTS.cycling]: 'cycling',
  [CardioTypesTS.rowing]: 'rowing',
  [CardioTypesTS.stair]: 'stair climbing',
  [CardioTypesTS.americanFootball]: 'American football',
  [CardioTypesTS.australianFootball]: 'Australian football',
  [CardioTypesTS.badminton]: 'badminton',
  [CardioTypesTS.basketball]: 'basketball',
  [CardioTypesTS.baseball]: 'baseball',
  [CardioTypesTS.cricket]: 'cricket',
  [CardioTypesTS.crossFit]: 'CrossFit',
  [CardioTypesTS.fitnessClass]: 'fitness class',
  [CardioTypesTS.hiking]: 'hiking',
  [CardioTypesTS.hockey]: 'hockey',
  [CardioTypesTS.jumpRope]: 'jump rope',
  [CardioTypesTS.paddling]: 'paddling',
  [CardioTypesTS.pilates]: 'pilates',
  [CardioTypesTS.rugby]: 'rugby',
  [CardioTypesTS.skiing]: 'skiing',
  [CardioTypesTS.snowboarding]: 'snowboarding',
  [CardioTypesTS.squash]: 'squash',
  [CardioTypesTS.softball]: 'softball',
  [CardioTypesTS.soccer]: 'soccer',
  [CardioTypesTS.tennis]: 'tennis',
  [CardioTypesTS.tableTennis]: 'table tennis',
  [CardioTypesTS.yoga]: 'yoga',
  [CardioTypesTS.volleyball]: 'volleyball',
  [CardioTypesTS.swimming]: 'swimming',
  [CardioTypesTS.dancing]: 'dancing',
  [CardioTypesTS.hiit]: 'HIIT',
  [CardioTypesTS.general]: 'general',
};

export const cardioDistanceActivityNames = {
  [CardioTypesTS.running]: 'run',
  [CardioTypesTS.walking]: 'walk',
  [CardioTypesTS.cycling]: 'ride',
  [CardioTypesTS.elliptical]: 'elliptical',
  [CardioTypesTS.rowing]: 'row',
  [CardioTypesTS.stair]: 'climb',
  [CardioTypesTS.general]: 'exercise',
};

const isAvaialable = value => value && value > 0;

export const levelName = id => {
  switch (id) {
    case CardioTypes.running:
    case CardioTypes.walking:
      return 'Incline';
    case CardioTypes.stair:
    case CardioTypes.elliptical:
      return 'Level';
    default:
      return 'Resistance';
  }
};

export const measureName = {
  time: 'Time',
  distance: 'Distance',
  avgSpeed: 'AvgSpeed',
  avgPace: 'AvgPace',
  maxSpeed: 'MaxSpeed',
  level: 'Level',
  calories: 'Calories',
  incline: 'Incline',
  resistance: 'Resistance',
  maxHeartRate: 'Max heart rate',
  avgHeartRate: 'Avg heart rate',
  totalCalories: 'Total calories',
  activeCalories: 'Active calories',
};

export const getTimeOfAnimation = (countOfImages, framesPerSecond = 15) =>
  (countOfImages * 1000) / framesPerSecond;

export const areStatsAvaialable = ({
  time,
  distance,
  speed,
  level,
  calories,
  maxHeartRate,
  avgHeartRate,
  activeCalories,
}) =>
  isAvaialable(time) ||
  isAvaialable(distance) ||
  !!speed ||
  !!level ||
  !!calories ||
  !!maxHeartRate ||
  !!avgHeartRate ||
  !!activeCalories;

/**
 * @deprecated use buildTime from builders.ts
 */
export const buildTime = ({ time }, units, shortTime = false) => {
  if (isAvaialable(time)) {
    return {
      name: measureName.time,
      type: 'time',
      title: 'Time',
      value: !shortTime ? `${formatTime(time)}` : `${formatShortTime(time)}`,
      hour: `${getHours(time)}`,
      min: `${getMinutesRemain(time)}`,
      sec: `${getSeconds(time)}`,
    };
  }
  return null;
};

/**
 * @deprecated use buildDistance from builders.ts
 */
export const buildDistance = ({ distance }, units) => {
  if (isAvaialable(distance)) {
    return {
      name: measureName.distance,
      title: 'Distance',
      value: `${_.round(distance, 2)} ${units.unitDistance}`,
      type: 'distance',
      rawValue: `${distance}`,
    };
  }
  return null;
};

/**
 * @deprecated use buildAvgSpeed from builders.ts
 */
export const buildAvgSpeed = ({ time, distance }, units) => {
  if (isAvaialable(time) && isAvaialable(distance)) {
    return {
      name: measureName.avgSpeed,
      type: 'speed',
      title: 'Avg Speed',
      value: `${_.round(distance / (time / 3600), 2)} ${units.unitDistance}/h`,
      rawValue: `${_.round(distance / (time / 3600), 2)}`,
    };
  }
  return null;
};

/**
 * @deprecated use buildAvgPace from builders.ts
 */
export const buildAvgPace = ({ time, distance, exerciseID }, units) => {
  if (isAvaialable(time) && isAvaialable(distance)) {
    const paceValue = exerciseID === CardioTypes.rowing ? (time / distance) * 500 : time / distance;
    const specialUnit = exerciseID === CardioTypes.rowing ? '/500 m' : null;
    return {
      name: measureName.avgPace,
      type: 'speed',
      title: 'Avg Pace',
      value: `${_.round(time / 60 / distance, 2)} /${units.unitDistance}`,
      rawValue: `${getMinutes(_.round(paceValue))}`,
      specialUnit,
    };
  }
  return null;
};

/**
 * @deprecated use buildSpeed from builders.ts
 */
export const buildSpeed = ({ speed }, units) => {
  if (speed) {
    return {
      name: measureName.maxSpeed,
      type: 'speed',
      title: 'Max Speed',
      value: `${speed} ${units.unitDistance}/h`,
      rawValue: `${speed}`,
    };
  }
  return null;
};

/**
 * @deprecated use buildLevel from builders.ts
 */
export const buildLevel = ({ level, exerciseID }) => {
  if (level) {
    return {
      name: levelName(exerciseID),
      type: 'level',
      title: levelName(exerciseID),
      value: level,
      rawValue: level,
    };
  }
  return null;
};

/**
 * @deprecated use buildCalories from builders.ts
 */
export const buildCalories = ({ calories }) => {
  if (calories) {
    return {
      name: measureName.calories,
      type: 'calories',
      title: 'Calories',
      value: _.round(calories),
      rawValue: _.round(calories),
    };
  }
  return null;
};

/**
 * Target text logic is slightly different than the other cardio target text. In order to simplify
 * the logic the interval cardio is separate than the regular cardio target text.
 */
export const getIntevalCardioTargetTitle = ({
  type, text, zone, userAge,
}) => {
  switch (type) {
    case TargetTypes.TIME_HEART_TYPE: {
      return getBpm(userAge, zone);
    }
    case TargetTypes.TIME_TYPE:
    case TargetTypes.TEXT_TYPE:
      return text;
    case TargetTypes.NONE_TYPE:
    default:
      return '';
  }
};

export const getTargetTitle = ({
  type,
  distance,
  time,
  text,
  distanceUnit,
  exerciseID,
  shortTitle,
}) => {
  const exerciseActivityName =
    cardioActivityNames[exerciseID] || cardioActivityNames[CardioTypes.general];

  const isMiles = distanceUnit === Units.IMPERIAL_UNITS.unitDistance;
  const milesUnitText = distance === 1 ? 'mile' : distanceUnit;
  const unit = isMiles ? milesUnitText : distanceUnit;

  switch (type) {
    case TargetTypes.DISTANCE_TYPE:
    case TargetTypes.DISTANCE_HEART_TYPE:
      return shortTitle
        ? `${distance} ${distanceUnit}`
        : `${exerciseActivityName} for ${distance} ${unit}`;

    case TargetTypes.TIME_TYPE:
    case TargetTypes.TIME_HEART_TYPE:
      return shortTitle ? `${formatTime(time)}` : `${exerciseActivityName} for ${formatTime(time)}`;

    case TargetTypes.TEXT_TYPE:
      return text;

    case TargetTypes.NONE_TYPE:
    default:
      return '';
  }
};

export const getIntervalTargetTitle = (stats, userAge) => {
  const { type, text, zone } = stats;
  switch (type) {
    case TargetTypes.TIME_HEART_TYPE: {
      return getBpm(userAge, zone);
    }
    case TargetTypes.TIME_TYPE:
    case TargetTypes.TEXT_TYPE: {
      return text;
    }
    case TargetTypes.NONE_TYPE:
    default:
      return '';
  }
};

export const getTargetDetailData = ({
  stats,
  unitDistance,
  exerciseID,
  userAge = null,
  shortTitle = false,
}) => {
  const targetUnits = getTargetUnits({ ...stats, exerciseID }, { distance: unitDistance });
  const {
    type, distance, time, text, zone,
  } = cardioStats({ ...stats, exerciseID }, targetUnits);
  const formattedUnits = formatUnitsByExercise(targetUnits, exerciseID);
  const title = getTargetTitle({
    type,
    distance,
    time,
    text,
    distanceUnit: formattedUnits.unitDistance,
    exerciseID,
    shortTitle,
  });
  if (type === TargetTypes.TIME_HEART_TYPE || type === TargetTypes.DISTANCE_HEART_TYPE) {
    return {
      title,
      zone: zones[zone] && getBpm(userAge, zone),
    };
  }
  return {
    title,
    targetTime: time,
  };
};

// If Cardio Type is Rowing, it will convert distance from meter to user based unit
export const convertDataForRequest = ({ data, units, exerciseID }) => {
  // [CASE: Rowing] Override Distance value with convert value
  if (CardioTypes.rowing === exerciseID) {
    if (!_.has(data, 'distance') || _.isNil(data.distance)) return data;
    const { unitDistance } = units;
    const distanceInKM = Units.meterToKM(_.toNumber(data.distance));
    const distance =
      unitDistance === Units.METRIC_UNITS.unitDistance
        ? distanceInKM
        : Units.kmToMiles(distanceInKM);
    return {
      ...data,
      distance,
    };
  }
  return data;
};

export default {
  convertDataForRequest,
};
