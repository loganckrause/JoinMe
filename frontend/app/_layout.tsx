import { Slot, Redirect } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '@/store/auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: true,
    }),
});


export default function RootLayout() {
    const colorScheme = useColorScheme();
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);

    return (
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Slot />
            {isAuthenticated ? (
                <Redirect href="/feed" />
            ) : (
                <Redirect href="/(auth)" />
            )}
         </ThemeProvider>
    );
}