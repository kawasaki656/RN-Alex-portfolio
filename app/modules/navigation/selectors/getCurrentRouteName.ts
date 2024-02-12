import { RootState } from 'store/types';
import { Route } from 'modules/navigation/types';

const getCurrentRouteName = (state: RootState): string | undefined => {
  const { nav } = state;
  if (!nav) return undefined;

  const { index, routes } = nav;
  const currentRoute: Route | undefined = routes[index];
  return currentRoute?.routeName;
};

export default getCurrentRouteName;
