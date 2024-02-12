import React from 'react';
import { connect } from 'react-redux';
import { View, BackHandler, StyleSheet } from 'react-native';
import { PropTypes } from 'prop-types';
import { addNavigationHelpers, NavigationActions, StackNavigator } from 'react-navigation';
import {
  createReactNavigationReduxMiddleware,
  createReduxBoundAddListener,
} from 'react-navigation-redux-helpers';
import CardStackStyleInterpolator from 'react-navigation/src/views/CardStack/CardStackStyleInterpolator';
import _ from 'lodash';
import withAddButtonAndMenu from 'ui/components/addmenu';
import {
  slideHorizontalInterpolator,
  fadeInterpolator,
  noneInterpolator,
} from './customInterpolators';
import Routes from './routes';
import {
  CLEAR_HISTORY_ROUTE,
  NAVIGATE_BACK,
  NAVIGATE_BACK_TO,
  NAVIGATE_TO,
  navigateBack,
  NAVIGATION_PREFIX,
  POP_TO_TOP,
  REPLACE_TO,
  REPLACE_WITH,
  RESET_TO,
  RESTORE_STATE,
  SET_PARAMS,
} from './actions';
import NavigationUtils from './NavigationUtils';

/**
 * This component is the one that handles navigation using reactnavigation library
 * all changes to top level navigation must be handled here
 */

const SLIDE_VERTICAL = 'slideVertical';
const SLIDE_HORIZONTAL = 'slideHorizontal';
const FADE = 'fade';
const SLIDE_HORIZONTAL_ONE_WAY = 'slideHorizontalOneWay';
const FADE_WITH_ANIMATION_FIX = 'fadeWithAnimationFix';
const NONE = 'none';

const INTERPOLATORS = {
  [SLIDE_VERTICAL]: CardStackStyleInterpolator.forVertical,
  [SLIDE_HORIZONTAL]: CardStackStyleInterpolator.forHorizontal,
  [FADE]: CardStackStyleInterpolator.forFade,
  [SLIDE_HORIZONTAL_ONE_WAY]: slideHorizontalInterpolator,
  [FADE_WITH_ANIMATION_FIX]: fadeInterpolator,
  [NONE]: noneInterpolator,
};

const getTransitionType = route => _.get(route, 'params.transition.type', null);

const getIntepolator = route => INTERPOLATORS[getTransitionType(route)];

const transitionConfig = args => {
  const { scene, scenes } = args;
  const lastScene = scenes[scenes.length - 1] || scene;
  const transitionSpecConfig =
    getTransitionType(lastScene.route) === NONE
      ? {
        transitionSpec: { duration: 0 },
      }
      : {};
  return {
    ...transitionSpecConfig,
    screenInterpolator: props => {
      const nextInterpolator = getIntepolator(props.scene.route);
      if (nextInterpolator) {
        return nextInterpolator(props);
      }
      const last = props.scenes[props.scenes.length - 1];

      const previouseInterpolator = getIntepolator(last.route);
      if (previouseInterpolator) {
        return previouseInterpolator(props);
      }
      return CardStackStyleInterpolator.forHorizontal(props);
    },
  };
};

const AppNavigator = StackNavigator(Routes, {
  transitionConfig,
  navigationOptions: {
    header: null,
  },
});

const initialState = AppNavigator.router.getStateForAction(
  AppNavigator.router.getActionForPathAndParams('SplashScreen'),
);

const isNotFunction = value => !_.isFunction(value);

const isTheSameScreen = (action, state) => {
  if (action.type.startsWith(NAVIGATION_PREFIX) && action.type !== NAVIGATE_BACK) {
    const { routeName, params } = action.payload;
    const lastRoute = state.routes[state.routes.length - 1];
    return (
      routeName === lastRoute.routeName &&
      _.isEqual(_.pickBy(params, isNotFunction), _.pickBy(lastRoute.params, isNotFunction))
    );
  }
  return false;
};

/**
 * This is a a helper function for nav reducer. On each action it will change
 * store state based on received action or return previouse one.
 *
 * All logic that should influence how navigation is performed in terms of state
 * should be done here
 *
 * @param {navigationState} state
 * @param {action} action
 * @returns navigation state
 */
const getNewNavState = (state, action) => {
  if (isTheSameScreen(action, state)) return state;
  switch (action.type) {
    case NAVIGATE_BACK:
      return AppNavigator.router.getStateForAction(NavigationActions.back(), state);
    case NAVIGATE_TO: {
      const { payload } = action;
      const currentRoute = Routes[payload.routeName];
      const transitionType = _.get(payload, 'params.transition.type', null);
      const disableGesture = _.get(payload, 'params.transition.disableGesture', false);
      const isTransitionVertical = transitionType === SLIDE_VERTICAL;
      const isEnableGesture = !(currentRoute && (isTransitionVertical || disableGesture));
      currentRoute.navigationOptions = {
        ...currentRoute.navigationOptions,
        gesturesEnabled: isEnableGesture,
      };
      return AppNavigator.router.getStateForAction(
        NavigationActions.navigate(action.payload),
        state,
      );
    }
    case RESET_TO:
      return AppNavigator.router.getStateForAction(
        NavigationActions.reset({
          index: 0,
          actions: [NavigationActions.navigate(action.payload)],
        }),
        state,
      );
    case REPLACE_TO: {
      const newState = {
        ...state,
        routes: [
          ...state.routes.slice(0, state.index),
          {
            ...action.payload,
            key: action.payload.key || action.payload.routeName,
          },
        ],
        index: state.index,
        immediate: true,
      };
      return newState;
    }
    case REPLACE_WITH: {
      const { payload } = action;
      const replaceIndex = _.get(payload, 'replaceIndex', state.index);
      const newStack = {
        ...action.payload,
        key: action.payload.key || action.payload.routeName,
      };
      const newRoutes = state.routes.slice();
      newRoutes.splice(replaceIndex, 1, newStack);
      const newState = {
        ...state,
        routes: newRoutes,
      };
      return newState;
    }
    case POP_TO_TOP: {
      return AppNavigator.router.getStateForAction(NavigationActions.popToTop(), state);
    }
    case RESTORE_STATE:
      return action.payload;
    case NAVIGATE_BACK_TO: {
      const { route } = action.payload;
      let backRouteIndex = -1;
      if (route) {
        backRouteIndex = _.findIndex(state.routes, item => item.routeName === route);
      }
      if (backRouteIndex === 0) {
        return AppNavigator.router.getStateForAction(NavigationActions.popToTop(), state);
      }
      if (backRouteIndex > 0) {
        const routes = state.routes.slice(0, backRouteIndex + 1);
        return {
          ...state,
          routes,
          index: backRouteIndex,
        };
      }
      return state;
    }
    case CLEAR_HISTORY_ROUTE: {
      return {
        ...state,
        routes: [state.routes[state.index]],
        index: 0,
        isTransitioning: false,
      };
    }
    case SET_PARAMS: {
      const routes = state.routes.map(route => {
        if (route.key === action.payload.key) {
          return { ...route, params: { ...route.params, ...action.payload.params } };
        }
        return route;
      });
      const newState = {
        ...state,
        routes,
      };
      return newState;
    }

    default:
      return AppNavigator.router.getStateForAction(action, state);
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

/**
 * Navigation reducer will return new state or previouse if getNewNavState doesn't return anything
 * @param {*} state
 * @param {*} action
 * @returns navigation state
 */
export const nav = (state = initialState, action) => getNewNavState(state, action) || state;

export const navMiddleware = createReactNavigationReduxMiddleware('root', state => state.nav);
const addListener = createReduxBoundAddListener('root');

class AppWithNavigationState extends React.Component {
  constructor(props) {
    super(props);
    this.handleBack = this.handleBack.bind(this);
  }

  componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', this.handleBack);
  }
  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.handleBack);
  }

  handleBack() {
    if (NavigationUtils.shouldCloseApp(this.props.nav)) return false;
    this.props.dispatch(navigateBack());
    return true;
  }

  render() {
    return (
      <View style={styles.container}>
        <AppNavigator
          navigation={addNavigationHelpers({
            dispatch: this.props.dispatch,
            state: this.props.nav,
            addListener,
          })}
        />
      </View>
    );
  }
}

AppWithNavigationState.propTypes = {
  dispatch: PropTypes.func.isRequired,
  nav: PropTypes.shape({ index: PropTypes.number.isRequired }).isRequired,
};

const mapStateToProps = state => ({
  nav: state.nav,
});

const wrappedComp = connect(mapStateToProps)(AppWithNavigationState);

export default withAddButtonAndMenu(wrappedComp);
