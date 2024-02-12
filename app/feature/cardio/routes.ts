import Cardio from './ui/cardio';
import CardioInputsData from './ui/cardioInputsData';
import CardioTimerTracker from './ui/cardioTimerTracker';

const routes = {
  Cardio: {
    screen: Cardio,
  },
  CardioInputsData: {
    screen: CardioInputsData,
  },
  CardioTimerTracker: {
    screen: CardioTimerTracker,
  },
} as const;

export default routes;
