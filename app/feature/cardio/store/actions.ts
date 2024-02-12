export const ADD_CARDIO_ENTRY = 'ADD_CARDIO_ENTRY';
export const HANDLE_PROGRESS = 'HANDLE_PROGRESS';
export const DELETE_CARDIO_ENTRY = 'DELETE_CARDIO_ENTRY';
export const BROKEN_RECORD = 'BROKEN_RECORD';
export const REMOVE_RECORDS = 'REMOVE_RECORDS';
export const TOGGLE_SUMMARY = 'TOGGLE_SUMMARY';
export const CARDIO_MILESTONE = 'CARDIO_MILESTONE';

export const addCardioEntry = data => ({ type: ADD_CARDIO_ENTRY, payload: data });
export const handleProgress = inProgress => ({ type: HANDLE_PROGRESS, payload: { inProgress } });
export const deleteCardioEntry = id => ({ type: DELETE_CARDIO_ENTRY, payload: { id } });
export const brokenRecord = data => ({ type: BROKEN_RECORD, payload: data });
export const cardioMilestone = data => ({ type: CARDIO_MILESTONE, payload: { data } });
export const removeRecords = () => ({ type: REMOVE_RECORDS });
export const toggleSummary = option => ({ type: TOGGLE_SUMMARY, payload: option });

export const STORE_CARDIO_ERROR = 'STORE_CARDIO_ERROR';
export const storeCardioError = error => ({
  type: STORE_CARDIO_ERROR,
  payload: { error },
});

export const STORE_LAST_CARDIO_ACTIVITIES = 'STORE_LAST_CARDIO_ACTIVITIES';
export const storeLastCardioActivities = lastCardioActivity => ({
  type: STORE_LAST_CARDIO_ACTIVITIES,
  payload: { lastCardioActivity },
});
