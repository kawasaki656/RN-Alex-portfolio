import React from 'react';
import { PropTypes } from 'prop-types';
import { StyleSheet, View, Image } from 'react-native';
import Label from 'components/label';
import { colors } from 'ui/constants';
import icons from './images';
import { getBpm } from '../../modules';

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  target: {
    fontSize: 24,
    color: colors.grayAluminium,
    textAlign: 'center',
    marginLeft: 8,
  },
});

const Bpm = ({ userAge, targetDetail }) => {
  const { zone } = targetDetail;
  const bpm = getBpm(userAge, zone);

  return (
    <View style={styles.wrapper}>
      <Image source={icons.heart} />
      <Label style={styles.target}>{bpm}</Label>
    </View>
  );
};

Bpm.defaultProps = {
  targetDetail: {},
  userAge: null,
};

Bpm.propTypes = {
  targetDetail: PropTypes.shape({}),
  userAge: PropTypes.number,
};

export default Bpm;
