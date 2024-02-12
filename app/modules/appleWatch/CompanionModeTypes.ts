export type CompanionModeActivityModel = {
  id?: number;
  activityTitle: string;
  isOutdoor?: boolean;
  isPerformance?: boolean;
  timeTarget?: number;
  workoutDetailsStr?: string;
  type: CalendarItemType;
  hkWorkoutType: HKWorkoutActivityType;
  timestamp?: number;
};

export enum MessageType {
  watchContext = 'watchContext',
  iosContext = 'iosContext',
  contextRequest = 'contextRequest',
  companionStart = 'companionStart',
  companionStartResult = 'companionStartResult',
  companionFinish = 'companionFinish',
  companionDiscard = 'companionDiscard',
  companionStat = 'companionStat',
  companionPause = 'companionPause',
  companionResume = 'companionResume',
  companionHaptic = 'companionHaptic',
  companionIsPendingResponse = 'companionIsPendingResponse',
  updateTodayList = 'updateTodayList',
  watchInfo = 'watchInfo',
}

export type ComanionModeMessage =
  | CompanionHapticMessage
  | CompanionStartMessage
  | CompanionStatMessage
  | CompanionStartResultMessage
  | CompanionFinishMessage
  | CompanionDiscardMessage
  | CompanionPauseMessage
  | CompanionResumeMessage
  | CompanionIsPendingResponseMessage
  | CompanionUpdateTodayList
  | WatchInfoMessage;

export type AppleWatchControlEvents =
  | CompanionFinishMessage
  | CompanionDiscardMessage
  | CompanionPauseMessage
  | CompanionResumeMessage;

export const isControlEvent = (event: ComanionModeMessage): event is AppleWatchControlEvents =>
  event.type === MessageType.companionDiscard ||
  event.type === MessageType.companionResume ||
  event.type === MessageType.companionPause ||
  event.type === MessageType.companionFinish;

export type ActivityStatsCodable = {
  startTime: number;
  endTime: number;

  time: number;
  activeCalories: number;
  basalCalories: number;

  // Hearth Rate
  bpm: number;
  bpmMin: number;
  bpmMax: number;
  bpmAvg: number;
  bpmUpdateTs: number;
  // Distance, Speed, Pace

  walking: any;
  cycling: any;
};

type ControlMessage = {
  time: number;
  timestamp: number;
};

type CompanionStartMessage = {
  type: MessageType.companionStart;
  message: CompanionModeActivityModel;
};

type CompanionStatMessage = {
  type: MessageType.companionStat;
  message?: ActivityStatsCodable;
};

type CompanionStartResultMessage = {
  type: MessageType.companionStartResult;
  message: boolean;
};

type CompanionFinishMessage = {
  type: MessageType.companionFinish;
  message: ControlMessage;
};

type CompanionDiscardMessage = {
  type: MessageType.companionDiscard;
  message: ControlMessage;
};

type CompanionPauseMessage = {
  type: MessageType.companionPause;
  message: ControlMessage;
};

type CompanionResumeMessage = {
  type: MessageType.companionResume;
  message: ControlMessage;
};

type CompanionHapticMessage = {
  type: MessageType.companionHaptic;
  message: WKHapticType;
};

export type CompanionIsPendingResponseMessage = {
  type: MessageType.companionIsPendingResponse;
  message: boolean;
};

export type CompanionUpdateTodayList = {
  type: MessageType.updateTodayList;
};

export type WatchInfoMessage = { message: string; type: MessageType.watchInfo };

export enum WKHapticType {
  notification = 0,
  directionUp = 1,
  directionDown = 2,
  success = 3,
  failure = 4,
  retry = 5,
  start = 6,
  stop = 7,
  click = 8,
}

export type CalendarItemType =
  | 'workoutCircuit'
  | 'workoutRegular'
  | 'workoutInterval'
  | 'cardio'
  | 'bodyStat'
  | 'photo'
  | 'reminderPhoto'
  | 'fms'
  | 'message'
  | 'habit'
  | 'workoutVideo';

export enum HKWorkoutActivityType {
  americanFootball = 1,

  archery = 2,

  australianFootball = 3,

  badminton = 4,

  baseball = 5,

  basketball = 6,

  bowling = 7,

  boxing = 8, // See also HKWorkoutActivityTypeKickboxing.

  climbing = 9,

  cricket = 10,

  crossTraining = 11, // Any mix of cardio and/or strength training. See also HKWorkoutActivityTypeCoreTraining and HKWorkoutActivityTypeFlexibility.,

  curling = 12,

  cycling = 13,

  dance = 14,

  // @available(iOS, introduced: 8.0, deprecated: 10.0, message: "Use HKWorkoutActivityTypeDance, HKWorkoutActivityTypeBarre or HKWorkoutActivityTypePilates")
  //  danceInspiredTraining = 15 // This enum remains available to access older data.,

  elliptical = 16,

  equestrianSports = 17, // Polo, Horse Racing, Horse Riding, etc.,

  fencing = 18,

  fishing = 19,

  functionalStrengthTraining = 20, // Primarily free weights and/or body weight and/or accessories,

  golf = 21,

  gymnastics = 22,

  handball = 23,

  hiking = 24,

  hockey = 25, // Ice Hockey, Field Hockey, etc.,

  hunting = 26,

  lacrosse = 27,

  martialArts = 28,

  mindAndBody = 29, // Qigong, meditation, etc.,

  // @available(iOS, introduced: 8.0, deprecated: 11.0, message: "Use HKWorkoutActivityTypeMixedCardio or HKWorkoutActivityTypeHighIntensityIntervalTraining")
  mixedMetabolicCardioTraining = 30, // This enum remains available to access older data.,

  paddleSports = 31, // Canoeing, Kayaking, Outrigger, Stand Up Paddle Board, etc.,

  play = 32, // Dodge Ball, Hopscotch, Tetherball, Jungle Gym, etc.,

  preparationAndRecovery = 33, // Foam rolling, stretching, etc.,

  racquetball = 34,

  rowing = 35,

  rugby = 36,

  running = 37,

  sailing = 38,

  skatingSports = 39, // Ice Skating, Speed Skating, Inline Skating, Skateboarding, etc.,

  snowSports = 40, // Sledding, Snowmobiling, Building a Snowman, etc. See also HKWorkoutActivityTypeCrossCountrySkiing, HKWorkoutActivityTypeSnowboarding, and HKWorkoutActivityTypeDownhillSkiing.,

  soccer = 41,

  softball = 42,

  squash = 43,

  stairClimbing = 44, // See also HKWorkoutActivityTypeStairs and HKWorkoutActivityTypeStepTraining.,

  surfingSports = 45, // Traditional Surfing, Kite Surfing, Wind Surfing, etc.,

  swimming = 46,

  tableTennis = 47,

  tennis = 48,

  trackAndField = 49, // Shot Put, Javelin, Pole Vaulting, etc.,

  traditionalStrengthTraining = 50, // Primarily machines and/or free weights,

  volleyball = 51,

  walking = 52,

  waterFitness = 53,

  waterPolo = 54,

  waterSports = 55, // Water Skiing, Wake Boarding, etc.,

  wrestling = 56,

  yoga = 57,

  // @available(iOS 10.0, *)
  //  barre = 58 // HKWorkoutActivityTypeDanceInspiredTraining,

  // @available(iOS 10.0, *)
  //  coreTraining = 59,

  // @available(iOS 10.0, *)
  //  crossCountrySkiing = 60,

  // @available(iOS 10.0, *)
  downhillSkiing = 61,

  // @available(iOS 10.0, *)
  //  flexibility = 62,

  // @available(iOS 10.0, *)
  highIntensityIntervalTraining = 63,

  // @available(iOS 10.0, *)
  jumpRope = 64,

  // @available(iOS 10.0, *)
  //  kickboxing = 65,

  // @available(iOS 10.0, *)
  pilates = 66, // HKWorkoutActivityTypeDanceInspiredTraining,

  // @available(iOS 10.0, *)
  snowboarding = 67,

  // @available(iOS 10.0, *)
  //  stairs = 68,

  // @available(iOS 10.0, *)
  //  stepTraining = 69,

  // @available(iOS 10.0, *)
  //  wheelchairWalkPace = 70,

  // @available(iOS 10.0, *)
  //  wheelchairRunPace = 71,

  // @available(iOS 11.0, *)
  //  taiChi = 72,

  // @available(iOS 11.0, *)
  mixedCardio = 73, // HKWorkoutActivityTypeMixedMetabolicCardioTraining,

  // @available(iOS 11.0, *)
  //  handCycling = 74,

  // @available(iOS 13.0, *)
  //  discSports = 75,

  // @available(iOS 13.0, *)
  //  fitnessGaming = 76,

  other = 3000,
}
