import React from 'react';
import { PropTypes } from 'prop-types';
import { StyleSheet, View } from 'react-native';
import Label from 'components/label';
import { colors } from 'ui/constants';

const styles = StyleSheet.create({
  target: {
    fontSize: 24,
    color: colors.grayAluminium,
    textAlign: 'center',
  },
});

const Target = ({ target }) => (
  <View>
    <Label style={styles.target}>{target}</Label>
  </View>
);
Target.defaultProps = {
  target: '',
};

Target.propTypes = {
  target: PropTypes.string,
};

export default Target;
