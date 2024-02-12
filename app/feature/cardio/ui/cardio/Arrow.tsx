import React from 'react';
import { StyleSheet, View, Image, TouchableWithoutFeedback } from 'react-native';
import PropTypes from 'prop-types';
import images from './images';

const styles = StyleSheet.create({
  closeWrapper: {
    position: 'absolute',
    right: 0,
    width: 40,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  buttonWrapper: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 4,
  },
});

const Arrow = ({ showDetails }) => (
  <View style={styles.closeWrapper}>
    <TouchableWithoutFeedback onPress={showDetails}>
      <View style={styles.buttonWrapper}>
        <Image source={images.arrow} />
      </View>
    </TouchableWithoutFeedback>
  </View>
);

Arrow.propTypes = {
  showDetails: PropTypes.func.isRequired,
};

export default Arrow;
