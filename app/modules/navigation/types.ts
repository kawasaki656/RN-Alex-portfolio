import React from 'react';
import { Action } from 'redux';
import {
  CLEAR_HISTORY_ROUTE,
  NAVIGATE_BACK,
  NAVIGATE_BACK_TO,
  NAVIGATE_TO,
  POP_TO_TOP,
  REPLACE_TO,
  REPLACE_WITH,
  RESET_TO,
  RESTORE_STATE,
  SET_PARAMS,
} from 'modules/navigation/actions';

export type Type =
  | typeof NAVIGATE_TO
  | typeof REPLACE_TO
  | typeof REPLACE_WITH
  | typeof RESET_TO
  | typeof POP_TO_TOP
  | typeof NAVIGATE_BACK
  | typeof NAVIGATE_BACK_TO
  | typeof RESTORE_STATE
  | typeof CLEAR_HISTORY_ROUTE
  | typeof SET_PARAMS;

export type Route = {
  routeName: string;
  params?: {
    [key: string]: unknown;
  };
  key: string;
  replaceIndex?: number;
};

export type NavActionType = {
  type: Type;
  payload: Omit<Route, 'replaceIndex'>;
};

export type RouteConfig = Record<
  string,
  {
    screen: React.Component | React.NamedExoticComponent | React.ConnectedComponent;
    tabBarLabel?: string;
    disable?: boolean;
    customAction?: {
      action: Action;
    };
    navigationOptions?: {
      tabBarTestIDProps?: {
        testID?: string;
      };
    };
  }
>;

export type NavigationParams<T> = { navigation: { state: { params: T } } };
