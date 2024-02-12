import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import _ from 'lodash';
import { connectActionSheet } from 'components/actionsheet';
import {
  deleteCardio,
  updateCardio,
  changeStatus,
  startWorkout,
  closeSummary,
  updateTargetDetail,
  closeCardio,
} from 'app/feature/cardio/middleware/actions';
import { navigateTo, navigateBack } from 'modules/navigation/actions';
import { formatDate, TITLE_DATE_FORMAT } from 'app/feature/calendar/modules/helpers';
import { getStats } from 'middleware/exercises/actions';
import { removedStats } from 'store/exercise/actions';
import { openExerciseDetails } from 'middleware/exerciseDetails/actions';
import Units from 'modules/units';
import User from 'modules/user';
import { allowDeleteWorkout } from 'app/feature/workoutTracker/modules';
import { openComment } from 'middleware/comments/actions';
import { trUsageThrowEvent } from 'middleware/trUsage/actions';
import Cardio from './Cardio';
import getNumberOfComments from 'feature/comments/store/numberOfComentsReducer/selectors/getNumberOfComments';

const mapStateToProps = (state, props) => {
  const cardioId = props.navigation.state.params.id;
  const { cardio } = state;
  const { error } = cardio;

  const cardioEntry = state.cardio.cardioById[cardioId];
  const title = cardioEntry ? formatDate(cardioEntry.date, TITLE_DATE_FORMAT) : '';

  const { pastStats, bestStats, statsRequestInProgress } = state.exerciseImageDownloaded;
  const allowDelete = allowDeleteWorkout(state, cardioEntry);
  const numberOfComments = getNumberOfComments(cardioId)(state);
  const userAge = User.age(state);

  return {
    cardioEntry,
    cardioId,
    inProgress: state.cardio.inProgress || state.clientSummary.inProgress,
    navBarParams: props.navigation.state.params,

    title,
    showSummary: state.cardio.showSummary,

    pastStats,
    bestStats,
    statsRequestInProgress,
    units: Units.units(state),
    trainer: User.isTrainer(state),
    allowDelete,
    nav: state.nav,
    navigateBack,
    numberOfComments,
    error,
    userAge,
  };
};

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      deleteCardio,
      updateCardio,
      changeStatus,
      startWorkout,
      navigateTo,
      closeSummary,
      getStats,
      removedStats,
      openExerciseDetails,
      updateTargetDetail,
      openComment,
      closeCardio,
      dispatch,
      trUsageThrowEvent,
    },
    dispatch,
  );

export default connect(mapStateToProps, mapDispatchToProps)(connectActionSheet(Cardio));
