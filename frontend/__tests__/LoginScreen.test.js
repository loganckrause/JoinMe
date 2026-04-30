import { render, fireEvent } from '@testing-library/react-native';
import LoginScreen from '../app/(tabs)/login';


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

describe('LoginScreen', () => {
  test('LoginScreen renders correctly', () => {
    const { getByText } = render(<LoginScreen />);
    const confrmTest = getByText('Login1');
    expect(confrmTest).toBeTruthy();
  });

  test('updates input values when typing', () => {
    const { getByPlaceholderText } = render(<LoginScreen />);
    const emailInput = getByPlaceholderText('Enter your email');
    const passwordInput = getByPlaceholderText('Enter your password');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');

    expect(emailInput.props.value).toBe('test@example.com');
    expect(passwordInput.props.value).toBe('password123');
  });

  test('login password input is secure', () => {
    const { getByPlaceholderText } = render(<LoginScreen />);
    const passwordInput = getByPlaceholderText('Enter your password');
    expect(passwordInput.props.secureTextEntry).toBe(true);
  });
});