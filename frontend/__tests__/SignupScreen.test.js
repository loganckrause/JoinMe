import { render, fireEvent } from '@testing-library/react-native';
import SignupScreen from '../app/(tabs)/signup';

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

jest.mock('../components/parallax-scroll-view', () => {
  return ({ children }) => children;
});

describe('SignupScreen', () => {
  test('SignupScreen renders correctly', () => {
    const { getByText } = render(<SignupScreen />);
    const welcomeText = getByText('Sign-up1');
    expect(welcomeText).toBeTruthy();
  });

  test('updates input values when typing', () => {
    const { getByPlaceholderText } = render(<SignupScreen />);
    const fnameInput = getByPlaceholderText('Enter your first name');
    const lnameInput = getByPlaceholderText('Enter your last name');
    const dobInput = getByPlaceholderText('mm/dd/yyyy');
    const emailInput = getByPlaceholderText('Enter your email');
    const passwordInput = getByPlaceholderText('Enter your password');
    const cnfmPasswordInput = getByPlaceholderText('Confirm your password');

    fireEvent.changeText(fnameInput, 'John');
    fireEvent.changeText(lnameInput, 'Doe');
    fireEvent.changeText(dobInput, '01/01/1990');
    fireEvent.changeText(emailInput, 'johndoe@gmail.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(cnfmPasswordInput, 'password123');
    
    expect(fnameInput.props.value).toBe('John');
    expect(lnameInput.props.value).toBe('Doe');
    expect(dobInput.props.value).toBe('01/01/1990');
    expect(emailInput.props.value).toBe('johndoe@gmail.com');
    expect(passwordInput.props.value).toBe('password123');
    expect(cnfmPasswordInput.props.value).toBe('password123');
  });

  test('signup password inputs are secure', () => {
    const { getByPlaceholderText } = render(<SignupScreen />);
    const passwordInput = getByPlaceholderText('Enter your password');
    const cnfmPasswordInput = getByPlaceholderText('Confirm your password');
    expect(passwordInput.props.secureTextEntry).toBe(true);
    expect(cnfmPasswordInput.props.secureTextEntry).toBe(true);
  });
});