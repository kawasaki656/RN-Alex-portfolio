import {
  ADD_CARDIO_ENTRY,
  HANDLE_PROGRESS,
  DELETE_CARDIO_ENTRY,
  BROKEN_RECORD,
  REMOVE_RECORDS,
  TOGGLE_SUMMARY,
  STORE_CARDIO_ERROR,
  CARDIO_MILESTONE,
  STORE_LAST_CARDIO_ACTIVITIES,
} from './actions';
import { CLEAR_DATA } from 'store/actions';

const initialState = {
  cardioById: {},
  inProgress: false,
  brokenRecords: {},
  showSummary: false,
  error: null,
  lastCardioActivities: [],
};

const cardioReducer = (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    case ADD_CARDIO_ENTRY:
      return {
        ...state,
        cardioById: { ...state.cardioById, [payload.id]: { ...payload } },
        error: initialState.error,
      };
    case DELETE_CARDIO_ENTRY: {
      const { id } = payload;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: deletedItem, ...cardioById } = state.cardioById;
      return { ...state, cardioById, error: initialState.error };
    }
    case STORE_CARDIO_ERROR: {
      const { error } = payload;
      return {
        ...state,
        error,
      };
    }
    case STORE_LAST_CARDIO_ACTIVITIES: {
      const { lastCardioActivity } = payload;
      const last2 = state.lastCardioActivities.slice(0, 2);
      return {
        ...state,
        lastCardioActivities: [lastCardioActivity, ...last2],
      };
    }
    case HANDLE_PROGRESS:
      return { ...state, inProgress: payload.inProgress };
    case BROKEN_RECORD:
      return { ...state, brokenRecords: { ...payload } };
    case REMOVE_RECORDS:
      return { ...state, brokenRecords: {} };
    case CARDIO_MILESTONE:
      return { ...state, milestone: { ...payload } };
    case TOGGLE_SUMMARY:
      return { ...state, showSummary: payload };
    case CLEAR_DATA:
      return initialState;
    default:
      return state;
  }
};

export default cardioReducer;
