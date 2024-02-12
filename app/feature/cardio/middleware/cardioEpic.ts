/* eslint-disable @typescript-eslint/no-unused-vars */
import { ofType, combineEpics } from 'redux-observable';
import { mergeMap, catchError, concatMap, concat, tap, map } from 'rxjs/operators';
import { empty } from 'rxjs/observable/empty';
import { isPast, parse } from 'date-fns';
import { from } from 'rxjs/observable/from';
import { fromPromise } from 'rxjs/observable/fromPromise';
import { of } from 'rxjs/observable/of';
import { cardio as strings, dialogs } from 'ui/constants/strings';
import _ from 'lodash';
import {
  addCardioEntry,
  deleteCardioEntry,
  handleProgress,
  brokenRecord,
  removeRecords,
  toggleSummary,
  storeCardioError,
  cardioMilestone,
} from 'app/feature/cardio/store/actions';
import { setClientContext, removeClientContext } from 'middleware/clientContext/actions';
import {
  navigateTo,
  navigateBack,
  popToTop,
  setParams,
  replaceTo,
} from 'modules/navigation/actions';
import { formatDate, isToday, TITLE_DATE_FORMAT } from 'app/feature/calendar/modules/helpers';
import { getClientSummaryObservable, showSummary } from 'modules/summary';
import { errorItemNotFound } from 'middleware/errors/actions';
import { calendarForceUpdate, toggleIndicatorAction } from 'app/feature/calendar/store/actions';
import { removeClientSummary } from 'store/clientSummary/actions';
import { setNumberOfComments } from 'store/comments/actions';
import { showSummaryCardio } from 'middleware/clientSummary/actions';
import { refreshCalendar, removeCalendarItem } from 'app/feature/calendar/middleware/actions';

import {
  checkConnectionBefore,
  startWithEndWith,
  getErrorResponseData,
  NO_OP,
} from 'middleware/utils';
import { trUsageThrowEvent } from 'middleware/trUsage/actions';
import {
  ADD_CARDIO,
  OPEN_CARDIO,
  CLOSE_CARDIO,
  UPDATE_CARDIO,
  DELETE_CARDIO,
  CHANGE_STATUS,
  MOVE_CARDIO,
  START_WORKOUT,
  SAVE_INPUT_DATA,
  updateCardio,
  CLOSE_SUMMARY,
  UPDATE_CARDIO_TARGET_DETAIL,
  POST_CARDIO_SAVE,
  postSave,
  CARDIO_TRACKER_ENDED,
  saveInputData,
  CLOSE_CARDIO_FROM_WATCH,
} from './actions';
import errors from 'middleware/constants';
import { showInfo } from 'middleware/info';
import { filterDatesWithExistingActivity } from 'modules/calendar';
import { cardioWithWatchStats } from 'app/feature/cardio/modules/CardioModule';
import { isTimeCardio, prepareDataForRequest } from 'app/feature/cardio/modules';
import { finishWorkflow } from 'middleware/workflow/actions';
import getCommentsForRequest from 'feature/comments/store/commentsToBeSentReducer/selectors/getCommentsForRequest';
import { getErrorType } from 'feature/workoutTracker/modules';
import AppleWatchModule from 'modules/appleWatch/AppleWatchModule';
import { Action, AppEpic } from 'middleware/Types';
import { RootState } from 'store/types';

const buildErrorMessage = message => `${message}. ${dialogs.errorNoConnection}`;
export const showProgress = () => startWithEndWith(handleProgress(true), handleProgress(false));
export const showCardioProgress = () => startWithEndWith(handleProgress(true), NO_OP);
export const endCardioProgress = () => startWithEndWith(NO_OP, handleProgress(false));
const fetchCardio = (id, userId, { cardioService }) =>
  fromPromise(cardioService.get(userId, id)).pipe(
    mergeMap(res => {
      if (res.code) {
        if (res.code === errors.notFound) {
          return of(errorItemNotFound(strings.errorNotFound, true));
        }
        if (res.code === errors.failedResponse) {
          return empty();
        }
      }
      const { numberOfComments, status } = res;

      return of(
        addCardioEntry(res),
        status === 'scheduled' ? NO_OP : setNumberOfComments({ attachTo: id, numberOfComments }),
      );
    }),
    catchError(err => {
      const data = getErrorResponseData(err);
      const error = getErrorType(data);
      return of(storeCardioError(error));
    }),
  );

const checkExistingCardioInCalendar = (date, exerciseId, dependencies, userId) => {
  const { calendarService } = dependencies;
  return calendarService.getCalendarData$(userId, date, date).pipe(
    map(res => {
      const { calendar } = res;
      const filterActivities = data =>
        data.filter(elem => elem.type === 'cardio' && elem.status === 'scheduled');

      const scheduledActivities = calendar.length ? filterActivities(calendar[0].items) : [];
      const existingCardio = scheduledActivities.find(
        elem => elem.detail.exerciseID === exerciseId,
      );
      return existingCardio ? existingCardio.id : null;
    }),
  );
};

const addCardioToday = (
  userid,
  exerciseId,
  date,
  targetDetail,
  state,
  dependencies,
  markAsComplete,
) => {
  const { RouteNames, cardioService, TrUsage } = dependencies;
  const openCardio = id =>
    of(
      navigateTo(RouteNames.Cardio, {
        title: formatDate(date, TITLE_DATE_FORMAT),
        id,
        transition: {
          type: 'slideVertical',
        },
      }),
      trUsageThrowEvent(TrUsage.EVENT_ACTION.DIALOG_CARDIO_OPEN),
    );

  const editCardio = id =>
    of(
      navigateTo(RouteNames.CardioInputsData, {
        title: formatDate(date, TITLE_DATE_FORMAT),
        id,
        transition: {
          type: 'none',
        },
      }),
      trUsageThrowEvent(TrUsage.EVENT_ACTION.CARDIO_PREVIEW_MARK_AS_COMPLETE),
    );
  return checkExistingCardioInCalendar(date, exerciseId, dependencies, userid).pipe(
    mergeMap(existingCardioId => {
      if (!existingCardioId) {
        return fromPromise(cardioService.add(userid, exerciseId, date, targetDetail)).pipe(
          mergeMap(res =>
            fetchCardio(res.id, userid, dependencies).pipe(
              concat(markAsComplete ? editCardio(res.id) : openCardio(res.id)),
            )),
          concat(of(refreshCalendar())),
        );
      }
      return fetchCardio(existingCardioId, userid, dependencies).pipe(
        concat(markAsComplete ? editCardio(existingCardioId) : openCardio(existingCardioId)),
      );
    }),
    catchError(() => empty()),
    showProgress(),
  );
};

const addCardioPast = (userid, exerciseId, date, targetDetail, state, dependencies) => {
  const { RouteNames, cardioService, TrUsage } = dependencies;

  const editCardio = id =>
    of(
      navigateTo(RouteNames.CardioInputsData, {
        title: formatDate(date, TITLE_DATE_FORMAT),
        id,
        transition: {
          type: 'none',
        },
      }),
      trUsageThrowEvent(TrUsage.EVENT_ACTION.CARDIO_PREVIEW_MARK_AS_COMPLETE),
    );

  return checkExistingCardioInCalendar(date, exerciseId, dependencies, userid).pipe(
    mergeMap(existingCardioId => {
      if (!existingCardioId) {
        return fromPromise(cardioService.add(userid, exerciseId, date, targetDetail)).pipe(
          mergeMap(res =>
            fetchCardio(res.id, userid, dependencies).pipe(concat(editCardio(res.id)))),
          concat(of(refreshCalendar())),
        );
      }
      return fetchCardio(existingCardioId, userid, dependencies).pipe(
        concat(editCardio(existingCardioId)),
      );
    }),
    catchError(() => empty()),
    showProgress(),
  );
};

const getDatesWithoutExistingCardio = (dates, exerciseId, dependencies, userId) => {
  const { calendarService } = dependencies;

  return calendarService.getCalendarData$(userId, dates[0], dates[dates.length - 1]).pipe(
    mergeMap(res => {
      const { calendar } = res;
      const predicate = calendarElem =>
        calendarElem.type === 'cardio' && calendarElem.detail.exerciseID === exerciseId;
      const sortedDates = filterDatesWithExistingActivity(dates, calendar, predicate);
      return from(sortedDates);
    }),
  );
};

const addCardioNotToday = (userid, exerciseId, dates, targetDetail, dependencies) => {
  const { cardioService, InfoBlock } = dependencies;
  return getDatesWithoutExistingCardio(dates, exerciseId, dependencies, userid).pipe(
    concatMap(date =>
      fromPromise(cardioService.add(userid, exerciseId, date, targetDetail)).pipe(
        mergeMap(res => fetchCardio(res.id, userid, dependencies)),
        showProgress(),
      )),
    concat(of(refreshCalendar()).pipe(tap(() => InfoBlock.showAddedBlock()))),
    catchError(() => empty()),
    startWithEndWith(toggleIndicatorAction(true), toggleIndicatorAction(false)),
  );
};

const deleteCardio = (userid, cardioId, { cardioService }) =>
  from([popToTop(), removeCalendarItem(cardioId, 'cardio')]).pipe(
    concat(
      fromPromise(cardioService.delete(userid, cardioId)).pipe(
        mergeMap(res => {
          if (res.code && res.code === errors.failedResponse) {
            return empty();
          }
          return of(deleteCardioEntry(cardioId));
        }),
        concat(of(refreshCalendar())),
        catchError(() => empty()),
        showProgress(),
      ),
    ),
  );

const setCardio = (userID, data, previousStatus, { cardioService }) =>
  fromPromise(cardioService.set(userID, { ...data }));

const setCardioInputs = (userID, data, dependencies, previousStatus, getState) => {
  const { cardioService, AppleWatchModule } = dependencies;
  return fromPromise(cardioService.set(userID, { ...data })).pipe(
    mergeMap(res => {
      if (res.code && res.code === errors.failedResponse) {
        return empty();
      }
      const brokenRecords = res.brokenRecord && [res.brokenRecord];
      const isShowSummary = showSummary(previousStatus, data.status, brokenRecords);
      const state = getState();

      const recordActions = res.brokenRecord ? [brokenRecord(res.brokenRecord)] : [removeRecords()];
      const clearDataActions = [finishWorkflow(), finishWorkflow(data.id)];

      AppleWatchModule.clearStats();
      if (isShowSummary) {
        return of(...recordActions, ...clearDataActions, cardioMilestone(res.milestone)).pipe(
          concat(getClientSummaryObservable(state, dependencies, [showSummaryCardio(res.id)])),
        );
      }
      return of(...recordActions, ...clearDataActions, postSave(res.id));
    }),
    catchError(() => of(handleProgress(false))),
    showCardioProgress(),
  );
};

const postSaveEpic: AppEpic = (action$, { getState }, { RouteNames }) =>
  action$.pipe(
    ofType(POST_CARDIO_SAVE),
    mergeMap(({ payload: { id } }) => {
      const state = getState();
      const { index } = state.nav;
      const currentRouteName = _.get(state.nav, `routes[${index}].routeName`);
      const action = currentRouteName === RouteNames.CardioInputsData ? navigateBack() : NO_OP;
      const actionsToDispatch = of(removeRecords(), updateCardio(id), refreshCalendar(), action);
      return actionsToDispatch;
    }),
  );

const moveCardio = (userID, data, showInfoBlock, dependencies) => {
  const { cardioService, InfoBlock } = dependencies;
  return fromPromise(cardioService.set(userID, { ...data })).pipe(
    tap(() => showInfoBlock && InfoBlock.showMovedBlock()),
    mergeMap(() => of(updateCardio(data.id))),
    concat(of(refreshCalendar())),
    catchError(() => of(calendarForceUpdate(), showInfo('', strings.errorUnableToSave))),
  );
};

const updateEpic: AppEpic = (action$, { getState }, dependencies) =>
  action$.pipe(
    ofType(UPDATE_CARDIO),
    mergeMap(({ payload: { id } }) => {
      const state = getState();
      const { User, RouteNames } = dependencies;
      const userid = User.id(state);
      return fetchCardio(id, userid, dependencies).pipe(
        showProgress(),
        concat(of(setParams(RouteNames.Cardio, { id }))),
      );
    }),
  );

const addEpic: AppEpic = (action$, { getState }, dependencies) =>
  action$.pipe(
    ofType(ADD_CARDIO),
    checkConnectionBefore(({
      payload: {
        dates, exerciseId, targetDetail, markAsComplete,
      },
    }) => {
      const { User } = dependencies;
      const state = getState();
      const userId = User.id(state);
      if (dates.length === 1 && isToday(dates[0])) {
        return addCardioToday(
          userId,
          exerciseId,
          dates[0],
          targetDetail,
          state,
          dependencies,
          markAsComplete,
        );
      } else if (dates.length === 1 && isPast(parse(dates[0]))) {
        return addCardioPast(
          userId,
          exerciseId,
          dates[0],
          targetDetail,
          state,
          dependencies,
          markAsComplete,
        );
      }

      return addCardioNotToday(userId, exerciseId, dates, targetDetail, dependencies);
    }, buildErrorMessage(dialogs.errorAdd)),
  );

const openEpic: AppEpic = (action$, store, { RouteNames, TrUsage }) =>
  action$.pipe(
    ofType(OPEN_CARDIO),
    mergeMap(({ payload: { id, date, clientID } }) =>
      of<Action>(
        navigateTo(RouteNames.Cardio, {
          title: formatDate(date, TITLE_DATE_FORMAT),
          id,
          transition: {
            type: 'slideVertical',
          },
        }),
        updateCardio(id),
        trUsageThrowEvent(TrUsage.EVENT_ACTION.DIALOG_CARDIO_OPEN),
      ).startWith(setClientContext(clientID))),
  );

const closeEpic: AppEpic = action$ =>
  action$.pipe(
    ofType(CLOSE_CARDIO),
    mergeMap(() => of(navigateBack(), removeClientContext())),
  );

const deleteEpic: AppEpic = (action$, { getState }, dependencies) =>
  action$.pipe(
    ofType(DELETE_CARDIO),
    checkConnectionBefore(({ payload: { id } }) => {
      const { User } = dependencies;
      const state = getState();
      const userId = User.id(state);

      return deleteCardio(userId, id, dependencies);
    }, buildErrorMessage(dialogs.errorAdd)),
  );

const changeStatusEpic: AppEpic = (action$, { getState }, dependencies) =>
  action$.pipe(
    ofType(CHANGE_STATUS),
    checkConnectionBefore(({ payload: { id, data } }) => {
      const { User } = dependencies;
      const state = getState();
      const userId = User.id(state);
      const cardio = state.cardio.cardioById[id];
      const { status } = cardio;
      const isShowSummary = showSummary(cardio.status, data.status);
      return setCardio(userId, { id, ...data }, status, dependencies).pipe(
        mergeMap(res => {
          if (isShowSummary) {
            return getClientSummaryObservable(state, dependencies, [showSummaryCardio(res.id)]);
          }
          return of(postSave(res.id));
        }),
        catchError(() => of(handleProgress(false))),
        showCardioProgress(),
      );
    }, buildErrorMessage(dialogs.errorAdd)),
  );

const moveEpic: AppEpic = (action$, { getState }, dependencies) =>
  action$.pipe(
    ofType(MOVE_CARDIO),
    checkConnectionBefore(
      ({
        payload: {
          item: { id, newDate, showInfoBlock },
        },
      }) => {
        const { User } = dependencies;
        const state = getState();
        const userId = User.id(state);
        const cardioId = parseInt(id, 10);

        return moveCardio(userId, { id: cardioId, date: newDate }, showInfoBlock, dependencies);
      },
    ),
  );

const startWorkoutEpic: AppEpic = (action$, store, { RouteNames }) =>
  action$.pipe(
    ofType(START_WORKOUT),
    mergeMap(({ payload: { id, date, status } }) =>
      of(
        navigateTo(RouteNames.CardioTimerTracker, {
          title: date,
          id,
          status,
          transition: {
            type: 'none',
            disableGesture: true,
          },
        }),
      )),
  );

const checkExistingAppleWatchData = (cardioService, userId, id) =>
  fromPromise(cardioService.get(userId, id)).pipe(
    map(res => {
      const checkValues = ['activeCalories', 'avgHeartRate', 'maxHeartRate'];
      const hasWatchStats = checkValues.some(key => !!res[key]);
      return {
        hasWatchStats,
        prevCalories: res.calories,
      };
    }),
  );

const handleSaveData = (hasWatchStats, prevCalories, convertedData) => {
  if (hasWatchStats) {
    const {
      activeCalories, avgHeartRate, maxHeartRate, calories, ...dataWithoutWatchStats
    } =
      convertedData;
    return {
      ...dataWithoutWatchStats,
      calories: prevCalories, // server sets calories property to null if we don't send it
    };
  }
  return convertedData;
};

const checkLocalWatchStats = (state: RootState, id: number) => {
  // we don't have appleWatchStats in edit or mobile only modes
  // in this cases we shoud always save all data from phone

  // if we have appleWatchStats we need to check watch data on the server at first
  const isHasLocalStats = AppleWatchModule.getWatchStats(id);
  return !isHasLocalStats;
};
const saveInputDataEpic: AppEpic = (action$, { getState }, dependencies) =>
  action$.pipe(
    ofType(SAVE_INPUT_DATA),
    checkConnectionBefore(({ payload: { id, data } }) => {
      const {
        User, Cardio, Units, cardioService,
      } = dependencies;
      const state = getState();
      const cardio = state.cardio.cardioById[id];
      const exerciseID = _.get(cardio, 'exerciseID', null);
      const status = _.get(cardio, 'status', 'scheduled');
      const userId = User.id(state);
      const units = Units.unitsShort(state);
      const comments = getCommentsForRequest(id)(state);

      const preperedData = prepareDataForRequest(data);
      const convertedData = Cardio.convertDataForRequest({ data: preperedData, units, exerciseID });
      const isEditMode = checkLocalWatchStats(state, id);

      if (!isEditMode) {
        return checkExistingAppleWatchData(cardioService, userId, id).pipe(
          mergeMap(({ hasWatchStats, prevCalories }) => {
            const dataToSend = handleSaveData(hasWatchStats, prevCalories, convertedData);
            return setCardioInputs(
              userId,
              { ...dataToSend, id, comments },
              dependencies,
              status,
              getState,
            );
          }),
        );
      }
      return setCardioInputs(
        userId,
        { ...convertedData, id, comments },
        dependencies,
        status,
        getState,
      );
    }, buildErrorMessage(dialogs.errorSave)),
  );

const cardioTrackerEndedEpic: AppEpic = (action$, { getState }, { RouteNames }) =>
  action$.pipe(
    ofType(CARDIO_TRACKER_ENDED),
    mergeMap(({ payload: { id, durationData } }) => {
      const state = getState();
      const cardio = state.cardio.cardioById[id];
      const appleWatchStats = AppleWatchModule.getWatchStats(id);
      const { startTime, endTime, workDuration } = durationData;
      const cardioEntry = !_.isEmpty(appleWatchStats)
        ? cardioWithWatchStats(cardio, appleWatchStats)
        : cardio;

      if (!!appleWatchStats && isTimeCardio(cardio.exerciseID)) {
        const {
          distance, level, speed, calories, activeCalories, avgHeartRate, maxHeartRate,
        } =
          cardioEntry;

        const data = {
          time: workDuration,
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
          workDuration,
        };
        return of(navigateBack(), saveInputData(id, data));
      }

      return of(
        replaceTo(RouteNames.CardioInputsData, {
          title: formatDate(cardioEntry.date, TITLE_DATE_FORMAT),
          id,
          time: workDuration,
          endTime,
          startTime,
          transition: {
            type: 'none',
          },
        }),
      );
    }),
  );

export const leaveSummary: AppEpic = action$ =>
  action$.pipe(
    ofType(CLOSE_SUMMARY),
    mergeMap(() =>
      of(removeClientSummary(), removeRecords()).pipe(concat(of(toggleSummary(false))))),
  );

const updateTargetDetailEpic: AppEpic = (action$, { getState }, dependencies) =>
  action$.pipe(
    ofType(UPDATE_CARDIO_TARGET_DETAIL),
    checkConnectionBefore(({ payload: { id, data } }) => {
      const { User } = dependencies;
      const state = getState();
      const userId = User.id(state);
      return setCardio(userId, { targetDetail: data, id }, null, dependencies).pipe(
        mergeMap(res => of(removeRecords(), updateCardio(res.id), refreshCalendar())),
        showProgress(),
      );
    }, buildErrorMessage(dialogs.errorAdd)),
  );

const closeCardioFromWatchEpic: AppEpic = (action$, state, { RouteNames, AppleWatchModule }) =>
  action$.pipe(
    ofType(CLOSE_CARDIO_FROM_WATCH),
    mergeMap(({ payload: { id } }) => {
      AppleWatchModule.clearStats();
      return from([
        removeClientContext(),
        finishWorkflow(),
        finishWorkflow(id),
        navigateTo(RouteNames.Main),
      ]);
    }),
  );

export default combineEpics(
  addEpic,
  openEpic,
  closeEpic,
  updateEpic,
  deleteEpic,
  changeStatusEpic,
  moveEpic,
  startWorkoutEpic,
  saveInputDataEpic,
  leaveSummary,
  updateTargetDetailEpic,
  postSaveEpic,
  cardioTrackerEndedEpic,
  closeCardioFromWatchEpic,
);
