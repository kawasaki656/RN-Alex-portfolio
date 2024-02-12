import React from 'react';
import { PropTypes } from 'prop-types';
import { StyleSheet, View, Platform, Keyboard } from 'react-native';
import _ from 'lodash';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { NavbarContainer, NavbarItem, NavbarText, Header as Navbarheader } from 'components/navbar';
import SafeAreaView from 'react-native-safe-area-view';
import Info from 'components/info';
import FullScreenLoader from 'components/fullScreenLoader';
import CalendarPicker from 'components/datepicker';
import navbarIcons from 'assets/images/navbar';
import { colors } from 'ui/constants';
import { moreMenu, navbar as navbarStrings } from 'ui/constants/strings';
import Alerts from 'modules/alerts';
import CommentsButton from 'ui/components/commentsButton';
import BackHardwareHandler from 'components/backHardwareHandler';
import HideTalkingHead from 'components/talkingHead/HideTalkingHead';
import { convertTimeForRequest, getExerciseImage } from 'app/feature/cardio/modules';
import { workoutStatus } from 'app/feature/workoutTracker/modules';
import { buildActionSheet, defer } from 'modules/actionsheet';
import Form from './Form';
import { isBigScreenHeight } from 'modules/rnutils';
import { isServerTimeLimitValid } from 'modules/validation';
import FeatureFlagAccessibility from 'modules/accessibility/FeatureFlagAccessibility';
import AppleWatchModule from 'modules/appleWatch/AppleWatchModule';

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.white,
  },
  infoWrapper: {
    marginBottom: 32,
  },
});

const deleteCardioAlert = (cardioEntry, deleteCardio) => {
  const destructiveAction = () => {
    deleteCardio(cardioEntry.id);
  };
  Alerts.showDeleteAlert(destructiveAction);
};

const changeCardioStatus = (cardioEntry, changeStatus) => {
  changeStatus(cardioEntry.id, {
    status: workoutStatus.scheduled,
    time: null,
    distance: null,
    level: null,
    speed: null,
    calories: null,
  });
};

const onMenuRequest = (
  {
    showActionSheetWithOptions, deleteCardio, changeStatus, cardioEntry,
  },
  movePicker,
) => {
  const renderSetStatus = cardioEntry.status !== workoutStatus.scheduled;

  const actionSheetConfig = [
    {
      option: moreMenu.move,
      action: movePicker,
    },
    {
      option: moreMenu.revertToScheduled,
      action: defer(changeCardioStatus, cardioEntry, changeStatus),
      hide: !renderSetStatus,
    },
    {
      option: moreMenu.delete,
      action: defer(deleteCardioAlert, cardioEntry, deleteCardio),
    },
    {
      option: moreMenu.cancel,
    },
  ];

  const defaultActionSheet = buildActionSheet(actionSheetConfig, showActionSheetWithOptions);
  defaultActionSheet();
};

class CardioInputsData extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      datePicker: {
        visible: false,
      },
      isKeyboardVisible: false,
    };

    this.formComponent = null;

    this.handleMenu = this.handleMenu.bind(this);
    this.closePicker = this.closePicker.bind(this);
    this.movePicker = this.movePicker.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.setFormComponentRef = this.setFormComponentRef.bind(this);
    this.scrollRef = React.createRef();
  }

  componentDidMount() {
    this.props.updateWorkflowRoute();
    const kbShowEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const kbHideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    this.keyboardWillShowListener = Keyboard.addListener(kbShowEvent, this.keyboardDidShow);
    this.keyboardWillHideListener = Keyboard.addListener(kbHideEvent, this.keyboardDidHide);
  }

  componentWillUnmount() {
    this.keyboardWillShowListener.remove();
    this.keyboardWillHideListener.remove();
  }

  onLayout = ({ nativeEvent }) => {
    const {
      layout: { height },
    } = nativeEvent;
    this.setState({ height });
  };

  getHeaderProps() {
    const { isKeyboardVisible } = this.state;
    const { numberOfComments, cardioEntry } = this.props;
    const skip = cardioEntry.status === workoutStatus.scheduled;
    const headerRight = (
      <NavbarContainer>
        <NavbarItem onPress={this.openExerciseDetails} icon={navbarIcons.regularGraph} />
        <CommentsButton onPress={this.openComment} count={numberOfComments} />
        <NavbarItem onPress={this.handleMenu} icon={navbarIcons.more} />
        <NavbarText
          onPress={this.handleSavePress}
          text={isKeyboardVisible ? navbarStrings.done : navbarStrings.save}
          textWeight="700"
        />
      </NavbarContainer>
    );

    return {
      headerRight,
      headerLeft: (
        <NavbarContainer>
          <NavbarText
            disableInteraction={false}
            onPress={skip ? this.handleSkip : this.handleClose}
            text={skip ? navbarStrings.skip : navbarStrings.cancel}
          />
        </NavbarContainer>
      ),
    };
  }

  setFormComponentRef(ref) {
    this.formComponent = ref;
  }

  handleMenu() {
    onMenuRequest(this.props, this.movePicker);
  }

  closePicker() {
    this.setState({ datePicker: { visible: false } });
  }

  movePicker(item) {
    this.setState({ datePicker: { visible: true, item } });
  }

  handleClose() {
    const {
      timeHours, timeMinutes, timeoutSeconds, distance, level, speed, calories,
    } =
      this.formComponent.getForm().formState;
    const data = {
      timeHours,
      timeMinutes,
      timeoutSeconds,
      distance,
      level,
      speed,
      calories,
    };
    const originalData = _.mapValues(this.props.inputData, value => (value === null ? '' : value));
    if (this.props.trackedTime || !_.isEqual(originalData, data)) {
      Alerts.showDiscardAlert(this.handleNavigateBack);
    } else {
      this.handleNavigateBack();
    }
  }

  handleNavigateBack = () => {
    const {
      cardioEntry: { id },
    } = this.props;
    this.props.finishWorkflow();
    this.props.finishWorkflow(id);
    AppleWatchModule.clearStats();
    this.props.navigateBack();
  };

  handleSavePress = () => {
    const { isKeyboardVisible } = this.state;
    if (isKeyboardVisible) {
      Keyboard.dismiss();
      return;
    }
    const { isValid } = this.formComponent.getForm();
    const {
      timeHours, timeMinutes, timeoutSeconds, distance, level, speed, calories,
    } =
      this.formComponent.getForm().formState;
    const { id } = this.props.cardioEntry;
    const { activeCalories, avgHeartRate, maxHeartRate } = this.props.inputData;
    const time = convertTimeForRequest(timeHours, timeMinutes, timeoutSeconds);
    const { startTime, endTime } = this.props;

    const data = {
      time,
      distance,
      level,
      speed,
      calories,
      activeCalories,
      avgHeartRate,
      maxHeartRate,
      status: 'tracked',
      startTime,
      endTime,
      workDuration: time,
    };

    if (isValid && isServerTimeLimitValid(time)) {
      this.props.saveInputData(id, data);
      this.props.storeLastCardioActivities(id);
    } else {
      Alerts.unableToSaveAlert();
    }
  };

  handleSkip = () => {
    const { isKeyboardVisible } = this.state;
    if (isKeyboardVisible) {
      Keyboard.dismiss();
      return;
    }
    const {
      cardioEntry, startTime, endTime, companionMode,
    } = this.props;
    const { id } = cardioEntry;
    const {
      activeCalories,
      avgHeartRate,
      maxHeartRate,
      calories,
      timeHours,
      timeMinutes,
      timeoutSeconds,
    } = this.props.inputData;

    const time = convertTimeForRequest(timeHours, timeMinutes, timeoutSeconds);

    const appleWatchStats = companionMode
      ? {
        calories,
        activeCalories,
        avgHeartRate,
        maxHeartRate,
      }
      : {};

    const data = {
      status: 'tracked',
      startTime,
      endTime,
      workDuration: time,
      time,
      ...appleWatchStats,
    };

    if (isServerTimeLimitValid(time)) {
      this.props.saveInputData(id, data);
    } else {
      Alerts.unableToSaveAlert();
    }
  };

  openComment = () => {
    const {
      cardioEntry: { id, status },
    } = this.props;
    this.props.openComment({ commentType: 'dailyWorkout', attachTo: id, status });
  };

  openExerciseDetails = () => {
    const { exerciseID } = this.props.cardioEntry;
    this.props.openExerciseDetails(exerciseID);
  };

  keyboardDidHide = () => {
    this.setState({ isKeyboardVisible: false });
  };

  keyboardDidShow = () => {
    this.setState({ isKeyboardVisible: true });
  };

  scrollToInput = reactNode => {
    if (this.scrollRef.current) {
      this.scrollRef.current.scrollToFocusedInput(reactNode);
    }
  };

  render() {
    const {
      inProgress,
      cardioEntry: {
        date, id, name, exerciseID,
      },
      inputData,
      workFlowState,
      updateWorkflowRoute,
      finishWorkflow,
      updateWorkflowState,
      unitDistance,
      companionMode,
    } = this.props;
    const moveItem = { date, id, type: 'cardio' };
    const headerProps = this.getHeaderProps();
    const marginTop = isBigScreenHeight() ? 48 : 68;

    return (
      <FeatureFlagAccessibility>
        <View style={styles.wrapper}>
          <HideTalkingHead />
          <BackHardwareHandler
            onBack={() => {
              this.handleClose();
              return true;
            }}
          />
          <Navbarheader {...headerProps} disabled={this.props.inProgress} />
          <KeyboardAwareScrollView
            style={styles.wrapper}
            onLayout={this.onLayout}
            ref={this.scrollRef}
            keyboardOpeningTime={0}
          >
            <SafeAreaView style={{ minHeight: this.state.height }} forceInset={{ bottom: 'never' }}>
              <View style={[styles.infoWrapper, { marginTop }]}>
                <Info title={name} exerciseImage={getExerciseImage(exerciseID)} />
              </View>
              <Form
                ref={this.setFormComponentRef}
                exerciseID={exerciseID}
                inputData={inputData}
                updateWorkflowRoute={updateWorkflowRoute}
                finishWorkflow={finishWorkflow}
                updateWorkflowState={updateWorkflowState}
                workFlowState={workFlowState}
                unitDistance={unitDistance}
                scrollToInput={this.scrollToInput}
                companionMode={companionMode}
              />
            </SafeAreaView>
            <CalendarPicker
              visible={this.state.datePicker.visible}
              onRequestClose={this.closePicker}
              itemToMove={moveItem}
              mode="move"
            />
            <FullScreenLoader inProgress={inProgress} />
          </KeyboardAwareScrollView>
        </View>
      </FeatureFlagAccessibility>
    );
  }
}

CardioInputsData.defaultProps = {
  cardioEntry: {},
  inProgress: false,
  title: '',
  saveInputData: () => {},
  trackedTime: false,
  saveNote: () => {},
  openComment: () => {},
  numberOfComments: 0,
  openExerciseDetails: () => {},
  companionMode: false,
  startTime: null,
  endTime: null,
};

CardioInputsData.propTypes = {
  cardioEntry: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    status: PropTypes.string,
    exerciseID: PropTypes.number,
    date: PropTypes.string,
  }),
  inProgress: PropTypes.bool,
  workFlowState: PropTypes.object, // eslint-disable-line
  updateWorkflowState: PropTypes.func.isRequired,
  finishWorkflow: PropTypes.func.isRequired,
  updateWorkflowRoute: PropTypes.func.isRequired,
  inputData: PropTypes.shape({
    timeHours: PropTypes.string,
    timeMinutes: PropTypes.string,
    timeoutSeconds: PropTypes.string,
    distance: PropTypes.number,
    level: PropTypes.number,
    speed: PropTypes.number,
    calories: PropTypes.number,
    activeCalories: PropTypes.number,
    avgHeartRate: PropTypes.number,
    maxHeartRate: PropTypes.number,
  }).isRequired,
  companionMode: PropTypes.bool,
  saveInputData: PropTypes.func,
  unitDistance: PropTypes.string.isRequired,
  navigateBack: PropTypes.func.isRequired,
  trackedTime: PropTypes.bool,
  navigation: PropTypes.object, // eslint-disable-line
  saveNote: PropTypes.func,
  title: PropTypes.string,
  openComment: PropTypes.func,
  numberOfComments: PropTypes.number,
  openExerciseDetails: PropTypes.func,
  storeLastCardioActivities: PropTypes.func.isRequired,
  startTime: PropTypes.string,
  endTime: PropTypes.string,
};

export default CardioInputsData;
