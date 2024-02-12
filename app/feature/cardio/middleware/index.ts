import { combineEpics } from 'redux-observable';
import cardioEpic from './cardioEpic';

export default combineEpics(cardioEpic);
