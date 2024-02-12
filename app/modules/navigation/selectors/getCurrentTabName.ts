import { RootState } from 'store/types';
import { Route } from 'modules/navigation/types';
import User from 'modules/user';

const getCurrentTabName = (state: RootState): string | undefined => {
  const isTrainer = User.isTrainer(state);
  const routesData = isTrainer ? state.mainScreenNav.trainer : state.mainScreenNav.client;
  if (!routesData) return undefined;

  const { index, routes } = routesData;
  const currentTab: Route | undefined = routes[index];
  return currentTab?.routeName;
};

export default getCurrentTabName;
