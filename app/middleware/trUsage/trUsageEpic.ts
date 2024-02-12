import { ofType, combineEpics } from 'redux-observable';
import { mergeMap, tap, catchError } from 'rxjs/operators';
import { empty } from 'rxjs/observable/empty';
import { TR_USAGE_THROW_EVENT, TR_USAGE_THROW_EVENT_TZ_SERVER } from './actions';
import { APP_REHYDRATE_FINISHED } from 'modules/persistHelpers';
import { APP_LOGGED_IN } from 'app/middleware/events/actions';
import { fromPromise } from 'rxjs/observable/fromPromise';

// Only for 1 event 'sessionstart' because server side uses this event to do calculation
const trUsageThrowEventTZServerEpic = (action$, { getState }, { TrUsageService, User, TrUsage }) =>
  action$.pipe(
    ofType(TR_USAGE_THROW_EVENT_TZ_SERVER),
    mergeMap(({ payload: { eventAction, extraParams, label } }) => {
      const userID = User.id(getState(), true);
      const loginFrom = TrUsage.EVENT_PLATFORM;
      const extraData = { from: loginFrom, ...extraParams };
      return fromPromise(
        TrUsageService.throwEventTZServer(userID, eventAction, loginFrom, extraData, label),
      ).pipe(
        mergeMap(() => empty()),
        catchError(() => empty()),
      );
    }),
  );

const trUsageThrowEventEpic = (action$, { getState }, { TrUsageService, User, TrUsage }) =>
  action$.pipe(
    ofType(TR_USAGE_THROW_EVENT),
    tap(({ payload: { eventAction, extraParams, label } }) => {
      const state = getState();
      const userID = User.id(state, true);
      const groupID = User.groupID(state);
      // Concat `- platform` to event name so it can filter by current mixpanel graph settings
      const eventActionName = `${eventAction} - ${TrUsage.EVENT_PLATFORM}`;
      const params = {
        userID,
        accountID: groupID,
        label,
        ...extraParams,
      };
      return TrUsageService.throwEvent(eventActionName, params);
    }),
    mergeMap(() => empty()),
  );

const trUsageSetDistinctIdEpic = (action$, { getState }, { TrUsageService, User }) =>
  action$.pipe(
    ofType(APP_REHYDRATE_FINISHED, APP_LOGGED_IN),
    tap(() => {
      const userID = User.id(getState(), true);
      if (userID) TrUsageService.setDistinctId(userID);
    }),
    mergeMap(() => empty()),
  );

export default combineEpics(
  trUsageThrowEventEpic,
  trUsageSetDistinctIdEpic,
  trUsageThrowEventTZServerEpic,
);
