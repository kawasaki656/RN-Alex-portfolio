import { NativeModules, NativeEventEmitter, Platform, EventSubscriptionVendor, NativeEventSubscription } from 'react-native';
import { eventSubscription } from 'modules/rnutils/EventSubscription';
import {
  CompanionModeActivityModel,
  WKHapticType,
  CompanionIsPendingResponseMessage,
  ComanionModeMessage,
  MessageType,
} from './CompanionModeTypes';

type AppleWatchKit = {
  getWatchSessionContext: () => Promise<any>;
  isPaired: () => Promise<boolean>;
  sendStart: (model: CompanionModeActivityModel) => Promise<{ isSuccess: boolean; error?: any }>;
  sendResume: (timestamp: number, timeInSeconds: number) => void;
  sendPause: (timestamp: number, timeInSeconds: number) => void;
  sendFinish: (timestamp: number, timeInSeconds: number) => void;
  sendDiscard: (timestamp: number, timeInSeconds: number) => void;
  sendTimeSync: (timestamp: number, timeInSeconds: number) => void;
  sendHaptic: (timestamp: number, hapticType: WKHapticType) => void;
  sendUpdateTodayList: () => void;
  sendUpdateWorkoutDetails: (calendarItemId: number) => void;
  isCompanionMode: () => Promise<boolean>;
  setEnable: (enable: boolean) => void;
  addWatchFace: (name: string) => void;
  getWatchInfo: () => Promise<{ message: string }>;
  addListener: (watchEvent: string, handler: () => void) => NativeEventSubscription;
  updateWorkoutDetails: (
    details: string,
    timeInSeconds: number,
    timestamp: number,
  ) => Promise<{ isSuccess: boolean }>;
};

type RNWatchKitType = EventSubscriptionVendor &
  Omit<AppleWatchKit, 'getWatchInfo'> & {
    queryIsCompanionModePending: () => Promise<CompanionIsPendingResponseMessage>;
    getWatchInfo: () => Promise<ComanionModeMessage>;
  };

class AppleWatch extends NativeEventEmitter implements AppleWatchKit {
  private nativeModule: RNWatchKitType;
  private enable: boolean;

  constructor(nativeModule: RNWatchKitType) {
    super(nativeModule);
    this.nativeModule = nativeModule;
    this.enable = true;
  }

  // Trainer doesn't have companion mode, we can use this to disable all event to watch
  setEnable(enable: boolean) {
    this.enable = enable;
  }

  sendResume(timestamp: number, timeInSeconds: number) {
    if (this.enable) this.nativeModule.sendResume(timestamp, timeInSeconds);
  }
  sendPause(timestamp: number, timeInSeconds: number) {
    if (this.enable) this.nativeModule.sendPause(timestamp, timeInSeconds);
  }
  sendFinish(timestamp: number, timeInSeconds: number) {
    if (this.enable) this.nativeModule.sendFinish(timestamp, timeInSeconds);
  }
  sendDiscard(timestamp: number, timeInSeconds: number) {
    if (this.enable) this.nativeModule.sendDiscard(timestamp, timeInSeconds);
  }
  sendTimeSync(timestamp: number, timeInSeconds: number) {
    if (this.enable) this.nativeModule.sendTimeSync(timestamp, timeInSeconds);
  }

  async sendStart(model: CompanionModeActivityModel): Promise<{ isSuccess: boolean; error?: any }> {
    if (this.enable) {
      try {
        const res = await this.nativeModule.sendStart(model);
        return res;
      } catch (error) {
        return { isSuccess: false, error };
      }
    } else {
      return { isSuccess: false, error: Error('Trainer cannt start companion mode') };
    }
  }
  getWatchSessionContext(): Promise<any> {
    return this.nativeModule.getWatchSessionContext();
  }

  isPaired(): Promise<boolean> {
    return this.nativeModule.isPaired();
  }

  isCompanionMode(): Promise<boolean> {
    return this.nativeModule
      .queryIsCompanionModePending()
      .then(event => {
        return event.message;
      })
      .catch(() => false);
  }

  sendHaptic(timestamp: number, hapticType: WKHapticType): void {
    if (this.enable) this.nativeModule.sendHaptic(timestamp, hapticType);
  }
  sendUpdateTodayList(): void {
    this.nativeModule.sendUpdateTodayList();
  }

  sendUpdateWorkoutDetails(calendarItemId: number): void {
    this.nativeModule.sendUpdateWorkoutDetails(calendarItemId);
  }

  addWatchFace(name: string): void {
    this.nativeModule.addWatchFace(name);
  }

  async getWatchInfo(): Promise<{ message: string }> {
    if (this.enable) {
      try {
        const res: ComanionModeMessage = await this.nativeModule.getWatchInfo();
        if (res.type === MessageType.watchInfo) return { message: res.message };
        return { message: '' };
      } catch (error) {
        return { message: '' };
      }
    } else {
      return { message: '' };
    }
  }

  async updateWorkoutDetails(
    details: string,
    timeInSeconds: number,
    timestamp: number,
  ): Promise<{ isSuccess: boolean }> {
    if (this.enable) {
      try {
        const res = await this.nativeModule.updateWorkoutDetails(details, timeInSeconds, timestamp);
        return res;
      } catch (error) {
        return { isSuccess: false };
      }
    } else {
      return { isSuccess: false };
    }
  }
}

const defaultObject: AppleWatchKit = {
  isPaired: () => Promise.resolve(false),
  getWatchSessionContext: () => Promise.resolve({}),
  sendStart: () => Promise.resolve({ isSuccess: false }),
  sendResume: () => {},
  sendPause: () => {},
  sendFinish: () => {},
  sendDiscard: () => {},
  sendTimeSync: () => {},
  isCompanionMode: () => Promise.resolve(false),
  sendHaptic: () => {},
  sendUpdateTodayList: () => {},
  sendUpdateWorkoutDetails: () => {},
  setEnable: () => {},
  addListener: () => eventSubscription(),
  addWatchFace: () => {},
  getWatchInfo: () => Promise.resolve({ message: '' }),
  updateWorkoutDetails: () => Promise.resolve({ isSuccess: false }),
};

// doesn't exist for Android so we fallback to default value
export default (Platform.OS === 'ios'
  ? new AppleWatch(NativeModules.RNWatchKit as RNWatchKitType)
  : defaultObject);
