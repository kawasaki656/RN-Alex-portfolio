import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { connectActionSheet } from 'components/actionsheet';
import _ from 'lodash';
import {
  deleteCardio,
  changeStatus,
  saveInputData,
  saveNote,
  closeSummary,
} from 'app/feature/cardio/middleware/actions';
import {
  finishWorkflow,
  updateWorkflowRoute,
  updateWorkflowState,
} from 'middleware/workflow/actions';
import Units from 'modules/units';
import Workflow from 'modules/workflow';
import { cardioUnits, cardioStats } from 'app/feature/cardio/modules';
import { cardioWithWatchStats } from 'app/feature/cardio/modules/CardioModule';
import { getHours, getMinutesRemain, getSeconds } from 'modules/dateHelper';
import { navigateBack } from 'modules/navigation/actions';
import { formatDate, TITLE_DATE_FORMAT } from 'app/feature/calendar/modules/helpers';
import { openComment } from 'middleware/comments/actions';
import { openExerciseDetails } from 'middleware/exerciseDetails/actions';
import { storeLastCardioActivities } from 'feature/cardio/store/actions';
import CardioInputsData from './CardioInputsData';
import getNumberOfComments from 'feature/comments/store/numberOfComentsReducer/selectors/getNumberOfComments';
import AppleWatchModule from 'modules/appleWatch/AppleWatchModule';
import { RootState } from 'store/types';

const mapStateToProps = (state: RootState, props) => {
  const {
    id: cardioId, time: timeFromTracker, startTime, endTime,
  } = props.navigation.state.params;
  const cardioEntry = state.cardio.cardioById[cardioId] || {};
  const userUnits = Units.unitsShort(state);
  const cardioWithStats = cardioStats(cardioEntry, userUnits);
  const appleWatchStats = AppleWatchModule.getWatchStats(cardioId);
  const formatedCardioEntry = !_.isEmpty(appleWatchStats)
    ? cardioWithWatchStats(cardioWithStats, appleWatchStats)
    : cardioWithStats;
  const {
    time: timeFromServer,
    distance,
    level,
    speed,
    calories,
    activeCalories,
    avgHeartRate,
    maxHeartRate,
  } = formatedCardioEntry;
  const time = typeof timeFromTracker === 'undefined' ? timeFromServer : timeFromTracker;
  const trackedTime = !!timeFromTracker;
  const hours = getHours(time, null);
  const minutes = getMinutesRemain(time, null);
  const seconds = getSeconds(time, null);
  const units = cardioUnits(state, formatedCardioEntry.exerciseID);
  const title = Object.keys(formatedCardioEntry).length
    ? formatDate(formatedCardioEntry.date, TITLE_DATE_FORMAT)
    : '';
  const numberOfComments = getNumberOfComments(cardioId)(state);

  return {
    cardioEntry: formatedCardioEntry,
    inProgress: state.cardio.inProgress,
    inputData: {
      timeHours: hours,
      timeMinutes: minutes,
      timeoutSeconds: seconds,
      distance,
      level,
      speed,
      calories,
      activeCalories,
      avgHeartRate,
      maxHeartRate,
    },
    unitDistance: units.unitDistance,
    workFlowState: Workflow.state(state),
    trackedTime,
    title,
    numberOfComments,
    companionMode: !!appleWatchStats,
    startTime,
    endTime,
  };
};

const mapDispatchToProps = {
  deleteCardio,
  changeStatus,
  updateWorkflowRoute,
  finishWorkflow,
  updateWorkflowState,
  saveInputData,
  navigateBack,
  saveNote,
  closeSummary,
  openComment,
  openExerciseDetails,
  storeLastCardioActivities,
};

export default connect(mapStateToProps, mapDispatchToProps)(connectActionSheet(CardioInputsData));
