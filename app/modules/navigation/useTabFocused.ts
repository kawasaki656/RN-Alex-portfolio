import { useSelector } from 'react-redux';
import getCurrentTrainerTab from 'modules/navigation/selectors/getCurrentTabName';

const useTabFocused = (tabRoute: string): boolean => {
  const currentTabName = useSelector(getCurrentTrainerTab);

  return currentTabName === tabRoute;
};

export default useTabFocused;
