export const OPEN_CARDIO = 'OPEN_CARDIO';
export const CLOSE_CARDIO = 'CLOSE_CARDIO';
export const UPDATE_CARDIO = 'UPDATE_CARDIO';
export const ADD_CARDIO = 'ADD_CARDIO';
export const DELETE_CARDIO = 'DELETE_CARDIO';
export const CHANGE_STATUS = 'CHANGE_STATUS';
export const MOVE_CARDIO = 'MOVE_CARDIO';
export const START_WORKOUT = 'START_WORKOUT';
export const SAVE_INPUT_DATA = 'SAVE_INPUT_DATA';
export const CLOSE_SUMMARY = 'CLOSE_SUMMARY';
export const UPDATE_CARDIO_TARGET_DETAIL = 'UPDATE_CARDIO_TARGET_DETAIL';
export const POST_CARDIO_SAVE = 'POST_CARDIO_SAVE';
export const CARDIO_TRACKER_ENDED = 'CARDIO_TRACKER_ENDED';
export const CLOSE_CARDIO_FROM_WATCH = 'CLOSE_CARDIO_FROM_WATCH';

export const openCardio = (id, date, clientID) => ({
  type: OPEN_CARDIO,
  payload: { id, date, clientID },
});
export const closeCardio = () => ({ type: CLOSE_CARDIO });
export const updateCardio = id => ({ type: UPDATE_CARDIO, payload: { id } });
export const postSave = id => ({ type: POST_CARDIO_SAVE, payload: { id } });
export const addCardio = (dates, exerciseId, targetDetail, markAsComplete) => ({
  type: ADD_CARDIO,
  payload: {
    dates,
    exerciseId,
    targetDetail,
    markAsComplete,
  },
});
export const deleteCardio = id => ({ type: DELETE_CARDIO, payload: { id } });
export const changeStatus = (id, data) => ({ type: CHANGE_STATUS, payload: { id, data } });
export const moveCardio = item => ({ type: MOVE_CARDIO, payload: { item } });
export const startWorkout = (id, date, status) => ({
  type: START_WORKOUT,
  payload: { id, date, status },
});
export const saveInputData = (id, data) => ({
  type: SAVE_INPUT_DATA,
  payload: { id, data },
});
export const cardioTrackerEnded = (id, durationData) => ({
  type: CARDIO_TRACKER_ENDED,
  payload: { id, durationData },
});
export const closeSummary = () => ({ type: CLOSE_SUMMARY });

export const updateTargetDetail = (id, data) => ({
  type: UPDATE_CARDIO_TARGET_DETAIL,
  payload: { id, data },
});

export const closeCardioFromWatch = id => ({
  type: CLOSE_CARDIO_FROM_WATCH,
  payload: { id },
});
