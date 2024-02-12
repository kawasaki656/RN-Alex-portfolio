import _ from 'lodash';
import { ActivityStatsCodable, MessageType } from 'modules/appleWatch/CompanionModeTypes';
import AsyncStorage from '@react-native-community/async-storage';
import { Subject } from 'rxjs';
import { retry, switchMap, throttleTime } from 'rxjs/operators';

type WatchEventHandler = {
  type: string;
  onPause?: () => void;
  onResume?: () => void;
  onDiscard?: () => void;
  onFinish?: () => void;
};

export const handleAppleWatchControlEvents = ({
  type,
  onPause,
  onResume,
  onDiscard,
  onFinish,
}: WatchEventHandler): void => {
  if (type === MessageType.companionPause && onPause != null) {
    onPause();
  }
  if (type === MessageType.companionResume && onResume != null) {
    onResume();
  }
  if (type === MessageType.companionDiscard && onDiscard != null) {
    onDiscard();
  }
  if (type === MessageType.companionFinish && onFinish != null) {
    onFinish();
  }
};

const getStatsData = (
  appleWatchStat: ActivityStatsCodable,
): {
  avgHeartRate: number;
  maxHeartRate: number;
  activeCalories: number;
  calories: number | null;
} => {
  const activeCalories = appleWatchStat.activeCalories ?? 0;
  const basalCalories = appleWatchStat.basalCalories ?? 0;
  const calories = _.isNumber(activeCalories) ? activeCalories + basalCalories : null;

  return {
    avgHeartRate: appleWatchStat.bpmAvg ?? null,
    maxHeartRate: appleWatchStat.bpmMax ?? null,
    activeCalories,
    calories,
  };
};

/**
 * instead of redux we store this data in global state in module
 * this stated is populated on startup and persisted to AsyncStorage
 * when it changes similar to redux-persist. This is done to avoid updates
 * to redux every second to improve performance via not triggering all redux
 * connected components
 */
let statsMap: Record<number | string, ActivityStatsCodable> = {};

const PERSIST_TIME_DURATION = 5000;
const persistChannel = new Subject();
persistChannel
  .pipe(
    throttleTime(PERSIST_TIME_DURATION),
    switchMap(stats => AsyncStorage.setItem(APPLE_WATCH_STATS_KEY, JSON.stringify(stats))),
    retry(),
  )
  .subscribe();

const APPLE_WATCH_STATS_KEY = '@TZpersisted:appleWatchStats';

AsyncStorage.getItem(APPLE_WATCH_STATS_KEY)
  .then(item => {
    if (item != null) {
      Object.assign(statsMap, JSON.parse(item));
    }
  })
  .catch(() => {});

const setWatchStats = (id: number, stats: ActivityStatsCodable | undefined): void => {
  if (stats == null) {
    delete statsMap[id];
  } else {
    statsMap[id] = stats;
  }
  persistChannel.next(statsMap);
};

const getWatchStats = (id: number): ActivityStatsCodable | undefined => statsMap[id];

const clearStats = (): void => {
  statsMap = {};
  AsyncStorage.removeItem(APPLE_WATCH_STATS_KEY).catch(() => {});
};

export default {
  getStatsData,
  setWatchStats,
  getWatchStats,
  clearStats,
};
