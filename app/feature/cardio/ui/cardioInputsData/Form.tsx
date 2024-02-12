import React from 'react';
import { PropTypes } from 'prop-types';
import ReactNative, { Platform, StyleSheet, View } from 'react-native';
import _ from 'lodash';
import { buildForm } from 'modules/form';
import { isNumber, isServerTimeLimitValid, lessThan } from 'modules/validation';
import Stat from 'components/cardiostat';
import { ListDivider } from 'components/list';
import { CardioTypes, convertTimeForRequest } from 'app/feature/cardio/modules';
import Units from 'modules/units';
import InputWithUnit from './InputWithUnit';
import memoizeOne from 'memoize-one';

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  innerWrapper: {
    marginHorizontal: 13,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    flex: 1,
    minWidth: 180,
  },
  stat: {
    flex: 0,
    flexDirection: 'row',
  },
  inputs: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flex: 1,
  },
  timeWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingLeft: 8,
    height: 30,
    flex: 0,
  },
  timeInput: {
    minWidth: 40,
    maxWidth: 40,
    flex: 0,
  },
  timeInputFirst: {
    flex: 1,
  },
  timeWrapperFirst: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingLeft: 8,
    height: 30,
    flex: 1,
  },
  units: {
    width: 68,
  },
});

const FixedStat = prop => (
  <View style={styles.stat}>
    <Stat {...prop} />
  </View>
);

const {
  running, walking, elliptical, cycling, rowing, stair,
} = CardioTypes;
const maxSpeed = [running, walking, cycling];
const resistance = [cycling, rowing];
const incline = [running, walking];
const level = [stair, elliptical];
const distance = [running, walking, elliptical, cycling, rowing];
const calories = [running, walking, elliptical, cycling, rowing, stair];

/**
 *
 * @param {number} exerciseID
 * @param {number[]} idsAvailableForType
 * @returns {boolean}
 */
const checkIsNecessaryRender = (exerciseID, idsAvailableForType) =>
  idsAvailableForType.includes(exerciseID);

/**
 * @param {number} exerciseID
 * @param {boolean} companionMode
 * @returns {string[]} list of fields to display
 */
const refConfig = memoizeOne((exerciseID, companionMode) => {
  const config = ['timeHours', 'timeMinutes', 'timeoutSeconds'];
  if (checkIsNecessaryRender(exerciseID, distance)) {
    config.push('distance');
  }
  if (checkIsNecessaryRender(exerciseID, resistance) || checkIsNecessaryRender(exerciseID, level)) {
    config.push('level');
  }
  if (checkIsNecessaryRender(exerciseID, maxSpeed)) {
    config.push('speed');
  }
  if (checkIsNecessaryRender(exerciseID, incline)) {
    config.push('level');
  }
  if (!companionMode && checkIsNecessaryRender(exerciseID, calories)) {
    config.push('calories');
  }
  return config;
});

class Form extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      inputData: props.inputData,
    };

    const isRowing = props.exerciseID === rowing;
    const regularValidators = [isNumber, lessThan(1000)];
    const levelValidators = [isNumber, lessThan(1000000)];
    const distanceValidators = isRowing ? [isNumber, lessThan(100000)] : regularValidators;
    const caloriesValidators = [isNumber, lessThan(100000)];

    this.form = buildForm(
      {
        timeHours: ['', regularValidators],
        timeMinutes: ['', regularValidators],
        timeoutSeconds: ['', regularValidators],
        distance: ['', distanceValidators],
        level: ['', levelValidators],
        speed: ['', regularValidators],
        calories: ['', caloriesValidators],
      },
      formData =>
        this.setState(
          {
            inputData: {
              ...this.state.inputData,
              ...formData,
            },
          },
          this.updateState,
        ),
    );
  }

  UNSAFE_componentWillMount() {
    this.props.updateWorkflowRoute();
  }

  componentDidMount() {
    const inputData = _.get(this.props, 'workFlowState.inputData', this.props.inputData);
    this.form.setState(inputData);
  }

  componentWillUnmount() {
    this.props.finishWorkflow();
  }

  getForm() {
    return this.form;
  }

  updateState() {
    const { inputData } = this.state;

    this.props.updateWorkflowState({
      inputData,
    });
  }

  isValid(name) {
    const control = this.form.control(name);
    return !control.isDirty || control.isValid;
  }

  // eslint-disable-next-line class-methods-use-this
  buildPropsForInput(name, form) {
    const control = form.control(name);
    const index = _.findIndex(this.inputRefs, item => item.name === name);
    const timeInput = ['timeHours', 'timeMinutes', 'timeoutSeconds'];
    const inputsAmount = this.inputRefs?.length ?? 0;
    const isLastInput = index === inputsAmount - 1;

    return {
      ...control.textInputProps,
      returnKeyType: isLastInput ? 'done' : 'next',
      onFocus: event => {
        if (Platform.OS === 'android' && event) {
          this.props.scrollToInput(ReactNative.findNodeHandle(event.target));
        }
        if (control.value === '0') control.onChangeText('');
        control.placeholder = '';
      },
      onBlur: () => {
        if (timeInput.includes(name) && control.value === '') {
          control.onChangeText('0');
        }
      },
      ref: this.inputRefs[index].ref,
      onSubmitEditing: () => this.focusNext(this.inputRefs[index + 1]),
    };
  }

  focusNext = (next = {}) => {
    const { ref } = next;
    if (ref && ref.current && ref.current.focus) {
      ref.current.focus();
    }
  };

  render() {
    const { exerciseID, unitDistance, companionMode } = this.props;
    const maxSpeedUnits = `${unitDistance}/h`;
    const { timeHours, timeMinutes, timeoutSeconds } = this.form.formState;
    const time = convertTimeForRequest(timeHours, timeMinutes, timeoutSeconds);
    const isTimeValid =
      this.isValid('timeHours') &&
      this.isValid('timeMinutes') &&
      this.isValid('timeoutSeconds') &&
      isServerTimeLimitValid(time);

    this.inputRefs = refConfig(this.props.exerciseID, this.props.companionMode).map(name => ({
      name,
      ref: React.createRef(),
    }));
    return (
      <View style={styles.wrapper}>
        <View style={styles.innerWrapper}>
          {!companionMode && (
            <>
              <View style={styles.row}>
                <FixedStat title="Time" type="time" valid={isTimeValid} />
                <View style={styles.inputs}>
                  <InputWithUnit
                    unit={Units.TIME_UNITS.unitHour}
                    inputStyles={styles.timeInputFirst}
                    wrapperStyle={styles.timeWrapperFirst}
                    placeholder="0"
                    {...this.buildPropsForInput('timeHours', this.form)}
                  />
                  <InputWithUnit
                    unit={Units.TIME_UNITS.unitMin}
                    inputStyles={styles.timeInput}
                    wrapperStyle={styles.timeWrapper}
                    placeholder="0"
                    {...this.buildPropsForInput('timeMinutes', this.form)}
                  />
                  <InputWithUnit
                    unit={Units.TIME_UNITS.unitSec}
                    inputStyles={styles.timeInput}
                    wrapperStyle={styles.timeWrapper}
                    placeholder="0"
                    {...this.buildPropsForInput('timeoutSeconds', this.form)}
                  />
                </View>
              </View>
              <ListDivider />
            </>
          )}
          {checkIsNecessaryRender(exerciseID, distance) && (
            <View>
              <View style={styles.row}>
                <FixedStat title="Distance" type="distance" valid={this.isValid('distance')} />
                <View style={styles.inputs}>
                  <InputWithUnit
                    unit={unitDistance}
                    {...this.buildPropsForInput('distance', this.form)}
                    hideDelimeter={this.props.exerciseID === rowing}
                  />
                </View>
              </View>
              <ListDivider />
            </View>
          )}

          {checkIsNecessaryRender(exerciseID, resistance) && (
            <View>
              <View style={styles.row}>
                <FixedStat title="Resistance" type="level" valid={this.isValid('level')} />
                <View style={styles.inputs}>
                  <InputWithUnit {...this.buildPropsForInput('level', this.form)} />
                </View>
              </View>
              <ListDivider />
            </View>
          )}

          {checkIsNecessaryRender(exerciseID, level) && (
            <View>
              <View style={styles.row}>
                <FixedStat title="Level" type="level" valid={this.isValid('level')} />
                <View style={styles.inputs}>
                  <InputWithUnit {...this.buildPropsForInput('level', this.form)} />
                </View>
              </View>
              <ListDivider />
            </View>
          )}

          {checkIsNecessaryRender(exerciseID, maxSpeed) && (
            <View>
              <View style={styles.row}>
                <FixedStat title="Max Speed" type="speed" valid={this.isValid('speed')} />
                <View style={styles.inputs}>
                  <InputWithUnit
                    unit={maxSpeedUnits}
                    {...this.buildPropsForInput('speed', this.form)}
                  />
                </View>
              </View>
              <ListDivider />
            </View>
          )}

          {checkIsNecessaryRender(exerciseID, incline) && (
            <View>
              <View style={styles.row}>
                <FixedStat title="Incline" type="level" valid={this.isValid('level')} />
                <View style={styles.inputs}>
                  <InputWithUnit {...this.buildPropsForInput('level', this.form)} />
                </View>
              </View>
              <ListDivider />
            </View>
          )}
          {!companionMode && checkIsNecessaryRender(exerciseID, calories) && (
            <>
              <View style={styles.row}>
                <FixedStat
                  title="Total calories"
                  type="calories"
                  valid={this.isValid('calories')}
                />
                <View style={styles.inputs}>
                  <InputWithUnit
                    inputStyles={styles.units}
                    {...this.buildPropsForInput('calories', this.form)}
                    returnKeyType={undefined}
                  />
                </View>
              </View>
              <ListDivider />
            </>
          )}
        </View>
      </View>
    );
  }
}

Form.defaultProps = {
  exerciseID: null,
  companionMode: false,
};

Form.propTypes = {
  exerciseID: PropTypes.number,
  updateWorkflowState: PropTypes.func.isRequired,
  finishWorkflow: PropTypes.func.isRequired,
  updateWorkflowRoute: PropTypes.func.isRequired,
  scrollToInput: PropTypes.func.isRequired,
  workFlowState: PropTypes.object, // eslint-disable-line
  inputData: PropTypes.shape({
    timeHours: PropTypes.string,
    timeMinutes: PropTypes.string,
    timeoutSeconds: PropTypes.string,
    distance: PropTypes.number,
    level: PropTypes.number,
    speed: PropTypes.number,
    calories: PropTypes.number,
    activeCalories: PropTypes.number,
    avgHeartRate: PropTypes.number,
    maxHeartRate: PropTypes.number,
  }).isRequired,
  unitDistance: PropTypes.string.isRequired,
  companionMode: PropTypes.bool,
};

export default Form;
