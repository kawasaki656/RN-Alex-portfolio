import React from 'react';
import { PropTypes } from 'prop-types';
import { StyleSheet, View, Animated, ScrollView, Dimensions } from 'react-native';
import SafeAreaView from 'react-native-safe-area-view';
import {
  NavbarContainer,
  NavbarItem,
  NavbarText,
  Header as Navbarheader,
  CloseButton,
} from 'components/navbar';
import navbarIcons from 'app/assets/images/navbar/index';
import { cardio as strings, navbar as navbarStrings, moreMenu } from 'ui/constants/strings';
import Info from 'components/info/index';
import FullScreenLoader from 'components/fullScreenLoader/index';
import CalendarPicker from 'components/datepicker/index';
import PrimaryContainer from 'components/buttons/PrimaryContainer';
import PrimaryButton from 'ui/components/buttons/PrimaryButton';
import { RouteNames } from 'modules/navigation/routes';
import {
  getExerciseStatus,
  getExerciseImage,
  getTargetDetailData,
  areStatsAvaialable,
  cardioStats,
} from 'app/feature/cardio/modules';
import { ERRORS } from 'modules/errors';
import { workoutStatus } from 'app/feature/workoutTracker/modules';
import Topmost from 'components/topmost';
import TrackedStats from 'components/cardiotrackedstats';
import { formatDate, TITLE_DATE_FORMAT } from 'app/feature/calendar/modules/helpers';
import NullScreen from 'components/nullscreen/NullScreen';
import { buildActionSheet, defer } from 'modules/actionsheet';
import { colors } from 'ui/constants';
import Alerts from 'modules/alerts';
import { CardioTarget } from 'ui/components/valuePicker';
import { withTheme } from 'ui/components/theme';
import { ThemeProps } from 'ui/constants/themes';
import { navigateBack } from 'modules/navigation/actions';
import CommentsButton from 'ui/components/commentsButton';
import BackHardwareHandler from 'components/backHardwareHandler';
import Label from 'components/label';
import HideTalkingHead from 'components/talkingHead/HideTalkingHead';
import LinkButton from 'components/buttons/LinkButton';
import TalkingHeadPosition from 'components/talkingHead/TalkingHeadPosition';
import TrUsage from 'modules/trUsage';
import { getSyncSourceText } from 'modules/connectApps';
import FeatureFlagAccessibility from 'modules/accessibility/FeatureFlagAccessibility';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: colors.gray2,
    fontSize: 18,
    fontWeight: 'bold',
  },
  wrapper: {
    flex: 1,
    backgroundColor: colors.white,
  },
  btnStyle: {
    justifyContent: 'center',
    height: 48,
    minWidth: '100%',
  },
  btnText: {
    fontSize: 17,
  },
  trackedStatsWrapper: {
    paddingTop: 24,
    paddingBottom: 16,
    width: '100%',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  markAsCompleteWrapper: {
    marginBottom: 82,
    paddingBottom: 20,
  },
  markAsComplete: {
    fontSize: 15,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  expanded: {
    paddingBottom: 16,
    justifyContent: 'flex-start',
  },
  syncSourceText: {
    fontSize: 13,
    color: colors.grayAluminium,
  },
  syncSourceWrapper: {
    alignItems: 'center',
    marginBottom: 32,
  },
});

const translateX = new Animated.Value(0);
const animateSaveIn = callback => {
  Animated.timing(translateX, {
    toValue: 1,
    duration: 300,
    useNativeDriver: true,
  }).start(callback);
};

const animateSaveOut = () => {
  Animated.timing(translateX, {
    toValue: 0,
    duration: 300,
    useNativeDriver: true,
  }).start();
};

const opacity = translateX.interpolate({
  inputRange: [0, 1],
  outputRange: [1, 0],
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
    showActionSheetWithOptions, deleteCardio, changeStatus, cardioEntry, allowDelete, trainer,
  },
  movePicker,
  openTargetDetailOverlay,
  handleEdit,
) => {
  const { targetDetail, status } = cardioEntry;
  const isTracked = status === workoutStatus.tracked;
  const isScheduled = status === workoutStatus.scheduled;
  const renderChangeTarget = !isTracked && trainer && targetDetail && targetDetail.type;
  const renderSetStatus = status !== workoutStatus.scheduled;
  const hasStats = areStatsAvaialable(cardioEntry);
  const actionSheetConfig = [
    {
      option: moreMenu.enterStats,
      action: handleEdit,
      hide: hasStats || isScheduled,
    },
    {
      option: moreMenu.editTrackedStats,
      action: handleEdit,
      hide: !hasStats || isScheduled,
    },
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
      option: moreMenu.changeTarget,
      action: openTargetDetailOverlay,
      hide: !renderChangeTarget,
    },
    {
      option: moreMenu.delete,
      action: defer(deleteCardioAlert, cardioEntry, deleteCardio),
      hide: !allowDelete,
    },
    {
      option: moreMenu.cancel,
    },
  ];

  const defaultActionSheet = buildActionSheet(actionSheetConfig, showActionSheetWithOptions);
  defaultActionSheet();
};

class Cardio extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      datePicker: {
        visible: false,
      },
      showTargetDetailOverlay: false,
      saveWidth: 0,
      padding: 0,
      expanded: false,
    };

    this.handleMenu = this.handleMenu.bind(this);
    this.closePicker = this.closePicker.bind(this);
    this.movePicker = this.movePicker.bind(this);
    this.handleStartWorkout = this.handleStartWorkout.bind(this);
    this.handleEdit = this.handleEdit.bind(this);
    this.handleBackPress = this.handleBackPress.bind(this);
    this.openExerciseDetails = this.openExerciseDetails.bind(this);
    this.openTargetDetailOverlay = this.openTargetDetailOverlay.bind(this);
    this.onMarkAsComplete = this.onMarkAsComplete.bind(this);
    this.handleCloseTargetDetailOverlay = this.handleCloseTargetDetailOverlay.bind(this);
    this.scrollView = React.createRef();
  }

  UNSAFE_componentWillMount() {
    const { status } = this.props.cardioEntry;
    this.props.navigation.setParams({ status });
  }

  componentDidMount() {
    this.props.navigation.addListener('didFocus', animateSaveOut);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const {
      cardioEntry: { status },
      title,
    } = this.props;
    const {
      cardioEntry: { status: nextStatus },
      title: nextTitle,
    } = nextProps;

    if (status !== nextStatus) {
      this.props.navigation.setParams({
        status: nextStatus,
      });
    }

    if (title !== nextTitle) {
      this.props.navigation.setParams({
        title: nextTitle,
      });
    }
  }

  onApply(data) {
    const {
      cardioEntry: { id },
    } = this.props;
    this.props.updateTargetDetail(id, data);
    this.handleCloseTargetDetailOverlay();
  }

  onClose() {
    this.handleCloseTargetDetailOverlay();
  }

  onMarkAsComplete() {
    this.handleEdit();
    this.handleCloseTargetDetailOverlay();
  }

  onSaveLayout = e => {
    const {
      layout: { width },
    } = e.nativeEvent;
    this.setState({ saveWidth: width });
  };

  onToggleExpand = (expanded, padding) => {
    this.setState({ expanded, padding }, () => {
      if (this.scrollView.current) {
        this.scrollView.current.scrollTo({ y: 0, x: 0, animated: true });
      }
    });
  };

  getHeaderProps() {
    const { title, closeCardio, numberOfComments } = this.props;
    const {
      theme: {
        appBar: { title: titleTheme },
      },
    } = this.props;
    const { status } = this.props.cardioEntry;
    const translate = translateX.interpolate({
      inputRange: [0, 1],
      outputRange: [this.state.saveWidth + 12, 0],
    });
    const headerRight = (
      <Animated.View style={[{ transform: [{ translateX: translate }] }]}>
        <NavbarContainer>
          <NavbarItem onPress={this.openExerciseDetails} icon={navbarIcons.regularGraph} />
          {status !== workoutStatus.scheduled && (
            <CommentsButton onPress={this.openComment} count={numberOfComments} />
          )}
          <NavbarItem onPress={this.handleMenu} icon={navbarIcons.more} />
          <NavbarText onLayout={this.onSaveLayout} text={navbarStrings.save} textWeight="700" />
        </NavbarContainer>
      </Animated.View>
    );

    return {
      headerTitle: (
        <Animated.View style={[styles.row, { opacity }]}>
          <Label
            style={[
              styles.title,
              titleTheme && titleTheme.color ? { color: titleTheme.color } : null,
            ]}
          >
            {title}
          </Label>
        </Animated.View>
      ),
      headerRight,
      headerLeft: (
        <NavbarContainer>
          <CloseButton onPress={closeCardio} />
        </NavbarContainer>
      ),
    };
  }

  openComment = () => {
    const {
      cardioEntry: { id, status },
    } = this.props;
    this.props.openComment({ commentType: 'dailyWorkout', attachTo: id, status });
  };

  handleMenu() {
    onMenuRequest(this.props, this.movePicker, this.openTargetDetailOverlay, this.handleEdit);
  }

  handleEdit() {
    const {
      cardioEntry: { id, date },
      navigateTo,
      navBarParams,
      trUsageThrowEvent,
    } = this.props;
    const callback = () =>
      navigateTo(RouteNames.CardioInputsData, {
        ...navBarParams,
        title: formatDate(date, TITLE_DATE_FORMAT),
        id,
        transition: {
          type: 'none',
        },
      });
    trUsageThrowEvent(TrUsage.EVENT_ACTION.CARDIO_PREVIEW_MARK_AS_COMPLETE);
    animateSaveIn(callback);
  }

  handleStartWorkout() {
    const { id, title } = this.props.navBarParams;
    const { status } = this.props.cardioEntry;
    this.props.startWorkout(id, title, status);
    this.props.trUsageThrowEvent(TrUsage.EVENT_ACTION.CARDIO_PREVIEW_START_NOW);
  }

  closePicker() {
    this.setState({ datePicker: { visible: false } });
  }

  movePicker(item) {
    this.setState({ datePicker: { visible: true, item } });
  }

  openTargetDetailOverlay() {
    this.setState({
      showTargetDetailOverlay: true,
    });
  }

  handleCloseTargetDetailOverlay() {
    this.setState({
      showTargetDetailOverlay: false,
    });
  }

  handleBackPress() {
    if (this.props.showSummary) {
      this.props.closeSummary();
    }
    this.props.dispatch(navigateBack());
    return true;
  }

  openExerciseDetails() {
    const { exerciseID } = this.props.cardioEntry;
    this.props.openExerciseDetails(exerciseID);
  }

  renderEntryDeletedNullScreen = () => {
    const { title, closeCardio } = this.props;
    const headerProps = {
      headerTitle: title,
      headerLeft: (
        <NavbarContainer>
          <CloseButton onPress={closeCardio} />
        </NavbarContainer>
      ),
    };
    return (
      <View style={styles.container}>
        <Navbarheader {...headerProps} />
        <NullScreen type={NullScreen.Type.DeletedEntry} />
      </View>
    );
  };

  renderConnectionErrorNullScreen = () => {
    const {
      title, closeCardio, updateCardio, cardioId,
    } = this.props;
    const headerProps = {
      headerTitle: title,
      headerLeft: (
        <NavbarContainer>
          <CloseButton onPress={closeCardio} />
        </NavbarContainer>
      ),
    };
    return (
      <View style={styles.container}>
        <Navbarheader {...headerProps} />
        <NullScreen type={NullScreen.Type.Connection} onRetry={() => updateCardio(cardioId)} />
      </View>
    );
  };

  renderNullScreen() {
    const { error } = this.props;
    switch (error) {
      case ERRORS.CONNECTION_ERROR:
        return this.renderConnectionErrorNullScreen();
      case ERRORS.ENTRY_DELETED:
      default:
        return this.renderEntryDeletedNullScreen();
    }
  }

  renderSyncSource = () => {
    const {
      cardioEntry: { from },
    } = this.props;
    const formatFrom = getSyncSourceText(from);
    if (!formatFrom) return null;
    return (
      <View style={styles.syncSourceWrapper}>
        <Label style={styles.syncSourceText}>{`Synced from ${formatFrom}`}</Label>
      </View>
    );
  };

  render() {
    const {
      inProgress,
      cardioEntry: {
        date, id, name, status, exerciseID, targetDetail,
      },
      units,
      error,
      userAge,
    } = this.props;

    const moveItem = { date, id, type: 'cardio' };
    const { showTargetDetailOverlay, padding, expanded } = this.state;
    const paddingTop = Dimensions.get('window').height < 667 ? 32 : 52;
    if ((!exerciseID && !inProgress) || error) {
      return this.renderNullScreen();
    }
    const headerProps = this.getHeaderProps();
    const hasTarget = targetDetail && targetDetail.type;
    const isTracked = status === workoutStatus.tracked;
    const isScheduled = status === workoutStatus.scheduled;
    const hasStats = isTracked && areStatsAvaialable(this.props.cardioEntry);

    return (
      <FeatureFlagAccessibility>
        <View style={styles.container}>
          {isTracked && <HideTalkingHead />}
          <BackHardwareHandler
            onBack={() => {
              this.handleBackPress();
              return true;
            }}
          />
          <Navbarheader {...headerProps} disabled={this.props.inProgress} />
          <View style={styles.wrapper}>
            <Topmost.Portal>
              <CardioTarget
                visible={showTargetDetailOverlay}
                onApply={targetDetailType => this.onApply(targetDetailType)}
                onClose={this.handleCloseTargetDetailOverlay}
                onMarkAsComplete={this.onMarkAsComplete}
                isMarkAsComplete
                forceInsetBottom
                units={units}
                targetDetail={cardioStats(
                  {
                    ...targetDetail,
                    exerciseID,
                  },
                  units,
                )}
                disableClose={false}
                title={strings.targetTitle}
                exerciseID={exerciseID}
              />
            </Topmost.Portal>
            <SafeAreaView
              style={styles.container}
              forceInset={{ bottom: isScheduled ? 'always' : 'never', top: 'never' }}
            >
              <ScrollView
                alwaysBounceVertical={false}
                contentContainerStyle={styles.scrollContainer}
                ref={this.scrollView}
              >
                <View
                  style={[
                    styles.container,
                    hasStats ? { paddingTop } : styles.centerContent,
                    expanded && { ...styles.expanded, paddingTop: padding },
                  ]}
                >
                  <Info
                    title={name}
                    status={getExerciseStatus(status)}
                    exerciseImage={
                      isScheduled ? getExerciseImage(exerciseID) : getExerciseImage(status)
                    }
                    showTargetButton={this.props.trainer && isScheduled && !hasTarget}
                    targetDetail={getTargetDetailData({
                      stats: targetDetail || {},
                      unitDistance: units.distance,
                      exerciseID,
                      userAge,
                    })}
                    openTargetDetailOverlay={this.openTargetDetailOverlay}
                    onToggleExpand={this.onToggleExpand}
                  >
                    {isTracked && hasStats && (
                      <View style={[styles.trackedStatsWrapper]}>
                        <TrackedStats dailyCardio={this.props.cardioEntry} />
                      </View>
                    )}
                  </Info>
                </View>
                {this.renderSyncSource()}
                {isScheduled && (
                  <View style={styles.markAsCompleteWrapper}>
                    <LinkButton
                      textStyle={styles.markAsComplete}
                      text="Mark as Complete"
                      onPress={this.handleEdit}
                    />
                  </View>
                )}
              </ScrollView>
            </SafeAreaView>
            {isScheduled && (
              <PrimaryContainer>
                <PrimaryButton
                  textStyle={styles.btnText}
                  buttonStyle={styles.btnStyle}
                  text={strings.startButton}
                  onPress={this.handleStartWorkout}
                />
              </PrimaryContainer>
            )}
            <PrimaryContainer>
              <TalkingHeadPosition padding={16} />
            </PrimaryContainer>
            <FullScreenLoader inProgress={inProgress} />
          </View>
          <CalendarPicker
            visible={this.state.datePicker.visible}
            onRequestClose={this.closePicker}
            itemToMove={moveItem}
            mode="move"
          />
        </View>
      </FeatureFlagAccessibility>
    );
  }
}

Cardio.defaultProps = {
  cardioEntry: {},
  cardioId: null,
  title: '',
  inProgress: false,
  startWorkout: () => {},
  changeStatus: () => {},
  navigateTo: () => {},
  showSummary: false,
  closeSummary: () => {},
  openExerciseDetails: () => {},
  bestStats: {},
  updateCardio: () => {},
  updateTargetDetail: () => {},
  trainer: false,
  units: {},
  navigation: {},
  openComment: () => {},
  nav: {},
  dispatch: () => {},
  numberOfComments: 0,
  error: null,
  userAge: null,
};

Cardio.propTypes = {
  cardioEntry: PropTypes.shape({
    name: PropTypes.string,
    status: PropTypes.string,
    exerciseID: PropTypes.number,
  }),
  cardioId: PropTypes.string,
  inProgress: PropTypes.bool,
  navBarParams: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    title: PropTypes.string,
  }).isRequired,
  title: PropTypes.string,
  startWorkout: PropTypes.func,
  changeStatus: PropTypes.func,
  navigateTo: PropTypes.func,
  navigation: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  showSummary: PropTypes.bool,
  closeSummary: PropTypes.func,
  openExerciseDetails: PropTypes.func,
  bestStats: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  updateCardio: PropTypes.func,
  updateTargetDetail: PropTypes.func,
  trainer: PropTypes.bool,
  units: PropTypes.shape({
    unitDistance: PropTypes.string,
  }),
  showActionSheetWithOptions: PropTypes.func.isRequired,
  theme: PropTypes.shape(ThemeProps).isRequired,
  openComment: PropTypes.func,
  closeCardio: PropTypes.func.isRequired,
  nav: PropTypes.object, // eslint-disable-line react/forbid-prop-types,
  dispatch: PropTypes.func,
  numberOfComments: PropTypes.number,
  error: PropTypes.string,
  userAge: PropTypes.number,
  trUsageThrowEvent: PropTypes.func.isRequired,
};

export default withTheme()(Cardio);
