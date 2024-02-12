import React from 'react';
import { StyleSheet, TextInputProps, View, ViewStyle } from 'react-native';
import { colors } from 'ui/constants';
import Label from 'components/label';
import LabelInput from 'components/labelinput';
import { floatNumberValidator, replaceComaWithDot } from 'feature/cardio/modules';

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingLeft: 8,
    height: 30,
    flex: 1,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
    fontSize: 16,
    textAlign: 'right',
    color: colors.dark,
    marginRight: 8,
  },
  unit: {
    fontSize: 17,
    color: colors.gray3,
  },
  unitWrapper: {
    flex: 0,
    alignItems: 'center',
  },
});

class InputWithUnit extends React.PureComponent<InputWithUnitProps> {
  constructor(props) {
    super(props);

    this.state = {
      isFocused: false,
    };

    this.handleTextChange = this.handleTextChange.bind(this);
    this.inputRef = React.createRef();
  }

  handleTextChange(value) {
    const isValid = floatNumberValidator(value);

    if (isValid) {
      const formatedValue = replaceComaWithDot(value);
      this.props.onChangeText(formatedValue);
    }
  }

  focus = () => {
    if (this.inputRef.current) this.inputRef.current.focus();
  };

  handleFocus = () => {
    this.setState({ isFocused: true }, () => {
      this.props.onFocus();
    });
  };

  render() {
    const {
      inputStyles, wrapperStyle, value, unit,
    } = this.props;
    const placeholder = this.state.isFocused ? '' : this.props.placeholder;

    return (
      <View style={[styles.wrapper, wrapperStyle]}>
        <LabelInput
          ref={this.inputRef}
          style={[styles.input, inputStyles]}
          value={value}
          placeholder={placeholder}
          placeholderColor={colors.gray7}
          onChangeText={this.handleTextChange}
          onFocus={this.handleFocus}
          autoCapitalize="none"
          keyboardType={this.props.hideDelimeter ? 'number-pad' : 'decimal-pad'}
          onSubmitEditing={this.props.onSubmitEditing}
          returnKeyType={this.props.returnKeyType}
          blurOnSubmit={this.props.returnKeyType !== 'next'}
          onBlur={this.props.onBlur}
        />
        <View style={styles.unitWrapper}>
          <Label style={styles.unit}>{unit}</Label>
        </View>
      </View>
    );
  }
}

type InputWithUnitProps = {
  onChangeText?: (text: string) => void;
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
  onFocus?: () => void;
  onBlur?: TextInputProps['onBlur'];
  returnKeyType?: TextInputProps['returnKeyType'];
  unit?: string;
  value?: string;
  inputStyles?: ViewStyle;
  wrapperStyle?: ViewStyle;
  hideDelimeter?: boolean;
  placeholder?: string;
};

InputWithUnit.defaultProps = {
  onChangeText: () => {},
  onSubmitEditing: () => {},
  onFocus: () => {},
  onBlur: () => {},
  returnKeyType: undefined,
  unit: '',
  value: '',
  inputStyles: {},
  wrapperStyle: {},
  hideDelimeter: false,
  placeholder: undefined,
};

export default InputWithUnit;
