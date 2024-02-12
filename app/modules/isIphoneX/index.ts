import { Dimensions, Platform } from 'react-native';

const isIos = Platform.OS === 'ios';
const X_HEIGHT = 812;
const XSMAX_HEIGHT = 896;

export const isIphoneX = () => {
  const { height, width } = Dimensions.get('window');
  return isIos && (height === X_HEIGHT || width === X_HEIGHT);
};

export const isIphoneXSMax = () => {
  const { height, width } = Dimensions.get('window');
  return isIos && (height === XSMAX_HEIGHT || width === XSMAX_HEIGHT);
};
