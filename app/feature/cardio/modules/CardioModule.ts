import {
  ActivityStatsCodable,
  HKWorkoutActivityType,
} from 'app/modules/appleWatch/CompanionModeTypes';
import AppleWatchModule from 'app/modules/appleWatch/AppleWatchModule';
import { CardioStats } from './types';
import _ from 'lodash';

export enum CardioTypes {
  running = 137,
  walking = 136,
  elliptical = 132,
  cycling = 243,
  rowing = 135,
  general = 327,
  stair = 134,
  americanFootball = 3000,
  australianFootball = 3001,
  badminton = 3002,
  basketball = 3003,
  baseball = 3004,
  cricket = 3005,
  crossFit = 3006,
  fitnessClass = 3007,
  hiking = 3008,
  hockey = 3009,
  jumpRope = 3010,
  paddling = 3011,
  pilates = 3012,
  rugby = 3013,
  skiing = 3014,
  snowboarding = 3015,
  squash = 3016,
  softball = 3017,
  soccer = 3018,
  tennis = 3019,
  tableTennis = 3020,
  yoga = 3021,
  volleyball = 3022,
  dancing = 3023,
  swimming = 3024,
  hiit = 3025,
}

export enum CardioMilestonesTypes {
  distance = 'distance',
  time = 'time',
}

export type CardioStatus = 'scheduled' | 'checkedin' | 'tracked';

export type Units = {
  unitDistance: string;
  unitWeight: string;
};

export type TargetDetail = {
  distance?: number;
  distanceUnit?: string;
  text?: string;
  time?: number;
  type?: number;
  zone?: number;
};

export const getHKWorkoutActivityType = (id: CardioTypes): HKWorkoutActivityType => {
  switch (id) {
    case CardioTypes.running:
      return HKWorkoutActivityType.running;
    case CardioTypes.walking:
      return HKWorkoutActivityType.walking;
    case CardioTypes.elliptical:
      return HKWorkoutActivityType.elliptical;
    case CardioTypes.cycling:
      return HKWorkoutActivityType.cycling;
    case CardioTypes.rowing:
      return HKWorkoutActivityType.rowing;
    case CardioTypes.stair:
      return HKWorkoutActivityType.stairClimbing;
    case CardioTypes.americanFootball:
      return HKWorkoutActivityType.americanFootball;
    case CardioTypes.australianFootball:
      return HKWorkoutActivityType.australianFootball;
    case CardioTypes.badminton:
      return HKWorkoutActivityType.badminton;
    case CardioTypes.basketball:
      return HKWorkoutActivityType.basketball;
    case CardioTypes.baseball:
      return HKWorkoutActivityType.baseball;
    case CardioTypes.cricket:
      return HKWorkoutActivityType.cricket;
    case CardioTypes.hiking:
      return HKWorkoutActivityType.hiking;
    case CardioTypes.hockey:
      return HKWorkoutActivityType.hockey;
    case CardioTypes.rugby:
      return HKWorkoutActivityType.rugby;
    case CardioTypes.skiing:
      return HKWorkoutActivityType.downhillSkiing;
    case CardioTypes.snowboarding:
      return HKWorkoutActivityType.snowboarding;
    case CardioTypes.squash:
      return HKWorkoutActivityType.squash;
    case CardioTypes.softball:
      return HKWorkoutActivityType.softball;
    case CardioTypes.soccer:
      return HKWorkoutActivityType.soccer;
    case CardioTypes.tennis:
      return HKWorkoutActivityType.tennis;
    case CardioTypes.tableTennis:
      return HKWorkoutActivityType.tableTennis;
    case CardioTypes.yoga:
      return HKWorkoutActivityType.yoga;
    case CardioTypes.volleyball:
      return HKWorkoutActivityType.volleyball;
    case CardioTypes.paddling:
      return HKWorkoutActivityType.paddleSports;
    case CardioTypes.jumpRope:
      return HKWorkoutActivityType.jumpRope;
    case CardioTypes.pilates:
      return HKWorkoutActivityType.pilates;
    case CardioTypes.crossFit:
      return HKWorkoutActivityType.crossTraining;
    case CardioTypes.fitnessClass:
      return HKWorkoutActivityType.mixedCardio;
    case CardioTypes.swimming:
      return HKWorkoutActivityType.swimming;
    case CardioTypes.dancing:
      return HKWorkoutActivityType.dance;
    case CardioTypes.hiit:
      return HKWorkoutActivityType.highIntensityIntervalTraining;
    case CardioTypes.general:
    default:
      return HKWorkoutActivityType.other;
  }
};

export const cardioWithWatchStats = (
  stats: CardioStats,
  appleWatchStat?: ActivityStatsCodable,
): CardioStats & {
  activeCalories?: string | null;
  calories?: string | null;
  avgHeartRate?: string | null;
  maxHeartRate?: string | null;
  time?: string | null;
} => {
  if (!appleWatchStat) return stats;
  const {
    activeCalories, calories, avgHeartRate, maxHeartRate,
  } =
    AppleWatchModule.getStatsData(appleWatchStat);
  return {
    ...stats,
    activeCalories: _.isFinite(activeCalories) ? `${activeCalories}` : null,
    calories: _.isFinite(calories) ? `${calories}` : null,
    avgHeartRate: _.isFinite(avgHeartRate) ? `${avgHeartRate}` : null,
    maxHeartRate: _.isFinite(maxHeartRate) ? `${maxHeartRate}` : null,
  };
};
