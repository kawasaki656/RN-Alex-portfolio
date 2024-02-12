import { RootState } from 'store/types';
import { RouteNames } from '../routes';
import { Route } from '../types';

const hasMealsScreenRoute = (state: RootState): boolean => {
  const routes: Route[] = state?.nav?.routes ?? [];
  return routes.some(route => route.routeName === RouteNames.MealsScreen);
};

export default hasMealsScreenRoute;
