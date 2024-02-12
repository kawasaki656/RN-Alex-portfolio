import React from 'react';
import { Alert, AppState, AppStateStatus, ScrollView, StyleSheet, View } from 'react-native';
import KeepAwake from 'react-native-keep-awake';
import AppleWatch from 'app/modules/appleWatch';
import {
  getHKWorkoutActivityType,
  CardioStatus,
  Units as UnitsType,
  TargetDetail,
} from 'app/feature/cardio/modules/CardioModule';
import { connectActionSheet } from 'components/actionsheet';
import { TimerContext } from 'modules/Timer/timerWrap';
import { EventSubscription } from 'modules/rnutils/EventSubscription';
import _ from 'lodash';
import TextToSpeech from 'modules/TextToSpeech';
import { Header } from 'components/navbar';
import OverlayWithCountDown from 'components/workoutOverlays/OverlayWithCountDown';
import Info from 'components/info';
import OverlayWithResume from 'components/workoutOverlays/OverlayWithResume';
import { RouteNames } from 'modules/navigation/routes';
import { formatDate, TITLE_DATE_FORMAT } from 'app/feature/calendar/modules/helpers';
import { cardio as strings } from 'ui/constants/strings';
import { getExerciseImage, getTargetDetailData } from 'app/feature/cardio/modules';
import { colors } from 'ui/constants';
import BackHardwareHandler from 'components/backHardwareHandler';
import TimerTrackerPanel from './TimerTrackerPanel';
import { haptic } from 'modules/haptics';
import durationCount, { DurationModuleType, HKDataType } from 'modules/duration';
import healthKitManager from 'modules/healthKitManager';
import { ComanionModeMessage, isControlEvent } from 'app/modules/appleWatch/CompanionModeTypes';
import AppleWatchModule, {
  handleAppleWatchControlEvents,
} from 'app/modules/appleWatch/AppleWatchModule';
import FeatureFlagAccessibility from 'modules/accessibility/FeatureFlagAccessibility';
import { AtLeastOne } from 'models/utils';
import { ShowActionSheetType } from 'ui/components/actionsheet/ActionSheet';

export const CARDIO_PERSIST_KEY = 'cardioTimer';

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.white,
  },
  infoWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  countDown: {
    opacity: 1,
    backgroundColor: colors.countDownOverlayColor,
  },
  resume: {
    opacity: 0.9,
    backgroundColor: colors.resumeOverlayColor,
  },
  expanded: {
    paddingBottom: 16,
    justifyContent: 'flex-start',
  },
  scrollContainer: {
    flexGrow: 1,
  },
});

const navigationOptions = (navigation: Navigation) => {
  const headerTitle = _.get(navigation, 'state.params.title', 'Cardio');

  return {
    headerLeft: null,
    headerTitle,
  };
};

type WorkFlowState = {
  showOverlayWithResume: boolean;
  showStopActionSheet: boolean;
};

type Navigation = {
  state: {
    params?: {
      title?: string;
    };
  };
};

type Props = {
  cardioEntry: {
    id: number;
    name: string;
    status: CardioStatus;
    targetDetail: TargetDetail;
    exerciseID: number;
    date: string;
    target: string;
  };
  updateWorkflowRoute: () => void;
  updateWorkflowState: (state: WorkFlowState) => void;
  replaceTo: (routeName: string, params?: Record<string | number, unknown>, key?: string) => void;
  navigateBack: () => void;
  navigation: Navigation;
  workFlowState: WorkFlowState | null;
  userAge: number | null;
  isClient: boolean;
  units: UnitsType;
  showActionSheetWithOptions: ShowActionSheetType;
  finishWorkflow: (key?: number) => void;
  durationWorkFlowState: any;
  cardioTrackerEnded: (id: number, durationData: any) => void;
  closeCardioFromWatch: (id: number) => void;
  mediaSexPreference: 'male' | 'female';
};

type State = {
  showOverlayWithCountDown: boolean;
  showStopActionSheet: boolean;
  expanded: boolean;
  padding: number;
  appleWatchConnected: boolean;
} & WorkFlowState;

class CardioTimerTracker extends React.PureComponent<Props, State, typeof TimerContext> {
  // eslint-disable-next-line react/sort-comp
  appStateSubscription?: EventSubscription;
  appleWatchSubscription?: EventSubscription;
  durationModule: DurationModuleType;

  static contextType = TimerContext;

  constructor(props: Props, context: typeof TimerContext) {
    super(props, context);

    const { elapsedTime } = this.getTimerState();
    this.state = {
      showOverlayWithCountDown: !elapsedTime,
      showOverlayWithResume: false,
      showStopActionSheet: false,
      expanded: false,
      padding: 0,
      appleWatchConnected: false,
      ...props.workFlowState,
    };
    this.durationModule = durationCount(
      // FIXME saving state by id should be used here instead state is overriden
      props.updateWorkflowState,
      props.durationWorkFlowState,
      props.cardioEntry.id,
    );
  }

  /**
   * Returns
   * @returns {React.ContextType<typeof TimerContext>}
   */
  getContext(): React.ContextType<typeof TimerContext> {
    return this.context as React.ContextType<typeof TimerContext>;
  }

  getTimer() {
    return this.getContext().getValue().timer;
  }

  getTimerState() {
    return this.getContext().getValue().state;
  }

  componentDidMount() {
    const { updateWorkflowRoute, isClient } = this.props;
    AppleWatch.setEnable(isClient);
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    this.appleWatchSubscription = AppleWatch.addListener('watchEvent', this.watchEventListener);
    updateWorkflowRoute();
    TextToSpeech.initTts();
    KeepAwake.activate();

    if (this.getTimerState().elapsedTime) {
      this.resumeAfterBackground();
    }
  }

  componentWillUnmount() {
    this.appStateSubscription?.remove();
    this.appleWatchSubscription?.remove();
    this.getTimer().dispose(CARDIO_PERSIST_KEY);
    KeepAwake.deactivate();
  }

  onToggleExpand = (expanded: boolean, padding: number) => {
    this.setState({ expanded, padding });
  };

  onStop = () => {
    this.pauseTimers();

    this.props.showActionSheetWithOptions(
      {
        options: [strings.endWorkout, strings.discard, strings.cancel],
        destructiveButtonIndex: 1,
        cancelButtonIndex: 2,
      },
      (itemIndex: number) => {
        switch (itemIndex) {
          case 0:
            this.endWorkout();
            break;
          case 1:
            this.showDiscardAlert();
            break;
          case 2:
            this.handleResume();
            break;
          default:
            break;
        }
      },
      this.handleResume,
    );
  };

  getTime = () => {
    const { elapsedTime } = this.getTimerState();
    return elapsedTime ? _.round(elapsedTime / 1000) : 0;
  };

  watchEventListener = (event: ComanionModeMessage) => {
    if (isControlEvent(event)) {
      const { type } = event;

      handleAppleWatchControlEvents({
        type,
        onDiscard: this.closeWorkoutFromWatch,
        onFinish: this.closeWorkoutFromWatch,
      });
    }
  };

  // eslint-disable-next-line class-methods-use-this
  handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'inactive' || nextAppState === 'background') {
      KeepAwake.deactivate();
    } else if (nextAppState === 'active') {
      KeepAwake.activate();
    }
  };

  resumeAfterBackground = () => {
    const { showOverlayWithResume, showStopActionSheet } = this.state;
    const paused = showOverlayWithResume || showStopActionSheet;
    if (!paused) {
      this.getTimer().resume();
    }
  };

  updateState = (state: AtLeastOne<WorkFlowState>) => {
    const newState = { ...this.state, ...state };
    this.setState(newState, () => {
      const { showOverlayWithResume, showStopActionSheet } = this.state;
      this.props.updateWorkflowState({
        showOverlayWithResume,
        showStopActionSheet,
      });
    });
  };

  handleCloseOverlay = () => {
    this.setState({
      showOverlayWithCountDown: false,
    });
    this.getTimer().startTimer();
    this.durationModule.start();
    this.startAppleWatch();
  };

  startAppleWatch = () => {
    const {
      cardioEntry: {
        id, name, exerciseID, targetDetail,
      },
    } = this.props;
    const { timestamp } = this.durationModule.data();

    AppleWatch.sendStart({
      id,
      activityTitle: name,
      hkWorkoutType: getHKWorkoutActivityType(exerciseID),
      type: 'cardio',
      timeTarget: targetDetail && targetDetail.time ? targetDetail.time : undefined,
      timestamp,
    })
      .then(resp => {
        if (resp.isSuccess) {
          AppleWatch.sendTimeSync(timestamp, this.getTime());
          this.setState({ appleWatchConnected: true });
        }
      })
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .catch(() => {});
  };

  storeHealthKitData = (healthKitData: HKDataType) => {
    // Trainer doesn't write data to HealthKit Store
    if (!this.props.isClient || this.state.appleWatchConnected) return;
    const {
      cardioEntry: { exerciseID, name },
    } = this.props;
    const data = {
      activityType: getHKWorkoutActivityType(exerciseID),
      startDate: healthKitData.startDate,
      endDate: healthKitData.endDate,
      duration: healthKitData.duration,
      activityTitle: name,
    };
    healthKitManager.storeWorkout(data);
  };

  endWorkout = () => {
    const { cardioEntry, cardioTrackerEnded } = this.props;
    const time = this.getTime();
    this.durationModule.stop();
    const durationData = this.durationModule.data();
    AppleWatch.sendFinish(durationData.timestamp, time);
    this.storeHealthKitData(durationData.healthkitData);
    cardioTrackerEnded(cardioEntry.id, durationData);
    this.getTimer().stop();
  };

  discardWorkout = () => {
    const {
      navigateBack,
      finishWorkflow,
      cardioEntry: { id },
    } = this.props;
    const time = this.getTime();
    const { timestamp } = this.durationModule.data();

    AppleWatch.sendDiscard(timestamp, time);
    this.getTimer().stop();

    this.durationModule.stop();
    finishWorkflow();
    finishWorkflow(id);
    navigateBack();
    AppleWatchModule.clearStats();
  };

  closeWorkoutFromWatch = () => {
    const {
      cardioEntry: { id },
      closeCardioFromWatch,
    } = this.props;
    this.getTimer().stop();
    this.durationModule.stop();
    closeCardioFromWatch(id);
  };

  showDiscardAlert() {
    this.updateState({
      showStopActionSheet: true,
    });
    Alert.alert(
      strings.discardText,
      '',
      [
        {
          text: strings.cancel,
          onPress: () => this.handleResume(),
          style: 'cancel',
        },
        {
          text: strings.discard,
          onPress: () => this.discardWorkout(),
          style: 'destructive',
        },
      ],
      { cancelable: false },
    );
  }

  pauseTimers = () => {
    const time = this.getTime();
    this.durationModule.pause();
    const { timestamp } = this.durationModule.data();
    AppleWatch.sendPause(timestamp, time);
    this.getTimer().pause();
  };

  resumeTimers = () => {
    const time = this.getTime();
    this.durationModule.resume();
    const { timestamp } = this.durationModule.data();
    AppleWatch.sendResume(timestamp, time);
    this.getTimer().resume();
  };

  handlePause = () => {
    this.pauseTimers();
    this.handleShowResumeOverlay();
  };

  handleShowResumeOverlay = () => {
    if (this.state.showOverlayWithResume) return;
    this.updateState({
      showOverlayWithResume: true,
    });
  };

  handleHideResumeOverlay = () => {
    if (!this.state.showOverlayWithResume) return;
    this.updateState({
      showOverlayWithResume: false,
    });
    this.handleResume();
  };

  handleResume = () => {
    this.updateState({
      showStopActionSheet: false,
      showOverlayWithResume: false,
    });
    this.resumeTimers();
  };

  navigateToCardioInputs = (time: number | null) => {
    const {
      replaceTo,
      cardioEntry: { id, date },
    } = this.props;
    const { endTime, startTime } = this.durationModule.data();

    replaceTo(RouteNames.CardioInputsData, {
      title: formatDate(date, TITLE_DATE_FORMAT),
      id,
      time,
      endTime,
      startTime,
      transition: {
        type: 'none',
      },
    });
  };

  render() {
    const {
      cardioEntry: {
        name, status, exerciseID, targetDetail, id,
      },
      userAge,
      units: { unitDistance },
      mediaSexPreference,
    } = this.props;
    const targetTime = targetDetail && targetDetail.time ? targetDetail.time : null;

    const targetDetailData = getTargetDetailData({
      stats: targetDetail || {},
      unitDistance,
      exerciseID,
      userAge,
    });
    const {
      showOverlayWithCountDown,
      showOverlayWithResume,
      padding,
      expanded,
      appleWatchConnected,
    } = this.state;
    const time = this.getTime();
    const targetReached = targetTime ? time / targetTime === 1 : false;

    if (targetReached) {
      haptic.longBuzzz();
    }

    return (
      <FeatureFlagAccessibility>
        <View style={styles.wrapper}>
          <BackHardwareHandler onBack={() => true} />
          <Header {...navigationOptions(this.props.navigation)} />
          {showOverlayWithCountDown ? (
            <OverlayWithCountDown
              containerStyles={styles.countDown}
              animationType="fade"
              handleCloseOverlay={this.handleCloseOverlay}
              sex={mediaSexPreference}
            />
          ) : null}
          {!showOverlayWithCountDown ? (
            <ScrollView alwaysBounceVertical={false} contentContainerStyle={styles.scrollContainer}>
              <View
                style={[
                  styles.infoWrapper,
                  expanded && { ...styles.expanded, paddingTop: padding },
                ]}
              >
                <Info
                  title={name}
                  exerciseImage={getExerciseImage(exerciseID)}
                  targetDetail={status !== 'tracked' ? targetDetailData : {}}
                  onToggleExpand={this.onToggleExpand}
                  timerMode
                />
              </View>
            </ScrollView>
          ) : null}
          {!showOverlayWithCountDown ? (
            <TimerTrackerPanel
              onStop={this.onStop}
              onPause={this.handlePause}
              id={id}
              targetTime={targetTime}
              appleWatchConnected={appleWatchConnected}
            />
          ) : null}
          {showOverlayWithResume ? (
            <OverlayWithResume
              containerStyles={styles.resume}
              animationType="fade"
              resumeText={strings.workoutPaused}
              handleHideResumeOverlay={this.handleHideResumeOverlay}
            />
          ) : null}
        </View>
      </FeatureFlagAccessibility>
    );
  }
}
export default connectActionSheet(CardioTimerTracker);
