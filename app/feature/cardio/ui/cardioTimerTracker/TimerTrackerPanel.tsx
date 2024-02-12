import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, View, TouchableWithoutFeedback, Image, Dimensions } from 'react-native';
import GestureRecognizer from 'react-native-swipe-gestures';
import ProgressBar from 'react-native-progress/Bar';
import { cardio as strings } from 'ui/constants/strings';
import { colors } from 'ui/constants';
import icons from 'assets/images/timer';
import Label from 'components/label';
import AppleWatchStats from 'app/ui/components/appleWatchStats';
import LayoutAnimation from 'modules/rnutils/LayoutAnimation';
import { isBigScreen } from 'modules/rnutils';
import { TimerContext } from 'modules/Timer/timerWrap';
import { useReadContextValue } from 'modules/useContextValue';
import _ from 'lodash';

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.workoutTimerBackground,
    minHeight: 120,
    alignItems: 'center',
  },
  progress: {
    height: 16,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
  },
  space: {
    height: 10,
    width: '100%',
  },
  divider: {
    height: 1,
    width: Dimensions.get('window').width - 32,
    backgroundColor: colors.grayAluminium,
    marginHorizontal: 16,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 20,
    height: 94,
    width: 250,
  },
  controlWrapper: {
    padding: 12,
  },
  swipeControlWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 12,
    height: 94,
  },
  pauseControlWrapper: {
    flexDirection: 'row',
  },
  pauseControl: {
    paddingRight: 4,
  },
  arrowIcon: {
    marginRight: 8,
  },
  unlockText: {
    fontSize: 20,
    color: colors.white,
    letterSpacing: 1,
  },
  watchStatsWrapper: {
    width: 264,
  },
});

const TimerTrackerPanel: React.FC = props => {
  const [isScreenLocked, setScreenLocked] = useState(false);
  const {
    state: { elapsedTime },
  } = useReadContextValue(TimerContext);
  const time = elapsedTime ? _.round(elapsedTime / 1000) : 0;
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [props.appleWatchConnected]);

  const handleLock = useCallback(() => {
    setScreenLocked(true);
  }, []);

  const handleUnlock = useCallback(() => {
    setScreenLocked(false);
  }, []);

  const renderTimeLeft = () => {
    const { targetTime } = props;
    if (!targetTime) return null;
    const progress = time / targetTime;
    const { width } = Dimensions.get('screen');
    const progressBarWidth = isBigScreen() ? width - 32 : 288;

    return (
      <ProgressBar
        progress={progress}
        height={6}
        color={progress < 1 ? colors.blue2 : colors.orange2}
        borderWidth={0}
        unfilledColor={colors.topBarBackgroundColor}
        width={progressBarWidth}
      />
    );
  };

  const { targetTime, appleWatchConnected } = props;
  const controllersBlockWidth = isBigScreen() ? 290 : 250;
  return (
    <GestureRecognizer onSwipeRight={handleUnlock}>
      <View style={styles.wrapper}>
        {appleWatchConnected ? (
          <View style={styles.watchStatsWrapper}>
            <AppleWatchStats id={props.id} />
          </View>
        ) : (
          <View style={styles.space} />
        )}
        <View style={styles.progress}>{renderTimeLeft()}</View>
        {!targetTime && appleWatchConnected && <View style={styles.divider} />}
        {!isScreenLocked && (
          <View style={[styles.controls, { width: controllersBlockWidth }]}>
            <TouchableWithoutFeedback onPress={props.onStop}>
              <View style={styles.controlWrapper}>
                <Image source={icons.stop} />
              </View>
            </TouchableWithoutFeedback>
            <TouchableWithoutFeedback onPress={handleLock}>
              <View style={styles.controlWrapper}>
                <Image source={icons.lock} />
              </View>
            </TouchableWithoutFeedback>
            <TouchableWithoutFeedback onPress={props.onPause}>
              <View style={[styles.controlWrapper, styles.pauseControlWrapper]}>
                <View style={styles.pauseControl}>
                  <Image source={icons.pause} />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        )}

        {isScreenLocked && (
          <View style={styles.swipeControlWrapper}>
            <Image style={styles.arrowIcon} source={icons.unlock} />
            <Label style={styles.unlockText}>{strings.swipeToUnlock}</Label>
          </View>
        )}
      </View>
    </GestureRecognizer>
  );
};

TimerTrackerPanel.defaultProps = {
  targetTime: null,
  appleWatchConnected: false,
};

TimerTrackerPanel.propTypes = {
  id: PropTypes.number.isRequired,
  onStop: PropTypes.func.isRequired,
  onPause: PropTypes.func.isRequired,
  targetTime: PropTypes.number,
  appleWatchConnected: PropTypes.bool,
};

export default React.memo(TimerTrackerPanel);
