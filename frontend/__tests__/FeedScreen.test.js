import { render, fireEvent } from '@testing-library/react-native';
import FeedScreen from '../app/(tabs)/feed';


jest.mock('react-native-reanimated', () =>      
  require('react-native-reanimated/mock')
);

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

jest.mock('react-native-gesture-handler', () => {
  return {
    GestureHandlerRootView: ({ children }) => children,
    GestureDetector: ({ children }) => children,
    Gesture: {
      Pan: () => ({
        onEnd: () => ({})
      }),
    },
  };
});

describe('FeedScreen', () => {
  test('FeedScreen renders correctly', () => {
    const { getByText } = render(<FeedScreen />);
    const welcomeText = getByText('JoinMe1');
    expect(welcomeText).toBeTruthy();
  });

  //Additional tests

});