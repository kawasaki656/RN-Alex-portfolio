import { connect } from 'react-redux';
import {
  deleteCardio,
  changeStatus,
  cardioTrackerEnded,
  closeCardioFromWatch,
} from 'app/feature/cardio/middleware/actions';
import {
  finishWorkflow,
  updateWorkflowRoute,
  updateWorkflowState,
} from 'middleware/workflow/actions';
import { navigateBack, replaceTo } from 'modules/navigation/actions';
import User from 'modules/user';
import Units from 'modules/units';
import Workflow from 'modules/workflow';
import CardioTimerTracker, { CARDIO_PERSIST_KEY } from './CardioTimerTracker';
import { RootState } from 'store/types';
import { NavigationParams } from 'modules/navigation/types';
import timerWrap from 'modules/Timer/timerWrap';

const mapStateToProps = (state: RootState, props: NavigationParams<{ id: number }>) => {
  const { id } = props.navigation.state.params;
  const cardioEntry = state.cardio.cardioById[id];
  const userAge = User.age(state);
  const isClient = User.isClient(state);
  const mediaSexPreference = User.mediaSexPreference(state);

  return {
    cardioEntry,
    userAge,
    isClient,
    units: Units.units(state),
    workFlowState: Workflow.state(state),
    durationWorkFlowState: Workflow.state(state, id),
    mediaSexPreference,
  };
};

const mapDispatchToProps = {
  deleteCardio,
  changeStatus,
  updateWorkflowRoute,
  updateWorkflowState,
  finishWorkflow,
  navigateBack,
  replaceTo,
  cardioTrackerEnded,
  closeCardioFromWatch,
};

export default timerWrap(
  connect(mapStateToProps, mapDispatchToProps)(CardioTimerTracker),
  CARDIO_PERSIST_KEY,
);
