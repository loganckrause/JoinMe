import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '@/services/config';

const FETCH_TIMEOUT_MS = 5000;
const STORAGE_TIMEOUT_MS = 5000;

async function fetchWithTimeout(input: RequestInfo, init?: RequestInit, timeoutMs = FETCH_TIMEOUT_MS) {
    let timedOut = false;
    const timeout = setTimeout(() => {
        timedOut = true;
    }, timeoutMs);

    try {
        const response = await fetch(input, init);
        if (timedOut) {
            throw new Error(`Request timeout after ${timeoutMs}ms`);
        }
        return response;
    } finally {
        clearTimeout(timeout);
    }
}

async function secureStoreSetItem(key: string, value: string) {
    return Promise.race([
        SecureStore.setItemAsync(key, value),
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`SecureStore.setItemAsync timeout for ${key}`)), STORAGE_TIMEOUT_MS)
        ),
    ]);
}

async function secureStoreGetItem(key: string) {
    return Promise.race([
        SecureStore.getItemAsync(key),
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`SecureStore.getItemAsync timeout for ${key}`)), STORAGE_TIMEOUT_MS)
        ),
    ]);
}

async function secureStoreDeleteItem(key: string) {
    return Promise.race([
        SecureStore.deleteItemAsync(key),
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`SecureStore.deleteItemAsync timeout for ${key}`)), STORAGE_TIMEOUT_MS)
        ),
    ]);
}
import { AppUser, BackendUser, mapBackendUserToAppUser } from '@/services/user';
import { registerForPushNotifications } from '@/services/notifications';

type AuthStore = {
    isAuthenticated: boolean;
    user: AppUser | null;
    token: string | null;
    setUser: (user: AppUser | null) => void;
    login: (email: string, password: string) => Promise<void>;
    register: (payload: {
        email: string;
        password: string;
        fullName: string;
        age: number;
        bio: string;
        categoryIds: number[];
        imageUri: string;
    }) => Promise<void>;
    logout: () => Promise<void>;
    restoreSession: () => Promise<void>;
};

export const useAuthStore = create<AuthStore>((set) => ({
    isAuthenticated: false,
    user: null,
    token: null,

    setUser: (user) => set({ user }),

    login: async (email: string, password: string) => {
        try {
            console.log('Attempting login with API_URL:', API_URL);
            const loginPayload = new URLSearchParams({
                username: email.trim(),
                password,
            }).toString();

            const response = await fetchWithTimeout(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                },
                body: loginPayload,
            });
            console.log('Login request completed', response.status, response.statusText);

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                const detail =
                    typeof error.detail === 'string'
                        ? error.detail
                        : `Login failed (${response.status})`;
                throw new Error(detail);
            }

            const data = await response.json();
            const token = data.access_token;
            console.log('Login successful, fetching user profile...');

            // Fetch user profile
            const userResponse = await fetchWithTimeout(`${API_URL}/users/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!userResponse.ok) {
                const errorText = await userResponse.text();
                console.error(`Failed to fetch user profile ${userResponse.status}:`, errorText);
                throw new Error(`Failed to fetch user profile: ${userResponse.status}`);
            }

            const backendUser = (await userResponse.json()) as BackendUser;
            const user = mapBackendUserToAppUser(backendUser);
            console.log('User profile fetched successfully');
            
            // Update state first - don't block on storage
            set({
                isAuthenticated: true,
                user,
                token,
            });

            // Store token and user data securely in background (non-blocking)
            Promise.allSettled([
                secureStoreSetItem('joinme_token', token),
                secureStoreSetItem('joinme_userData', JSON.stringify(user)),
            ]).then(() => {
                console.log('SecureStore write completed in background');
            }).catch((error) => {
                console.error('SecureStore write error:', error);
            });

            registerForPushNotifications(token).catch((err) => {
                console.warn('Push token registration failed:', err);
            });
        } catch (error) {
            console.error('Login error:', error);
            if (error instanceof TypeError || (error instanceof Error && error.message.includes('timeout'))) {
                const msg = `Cannot reach backend at: ${API_URL}. Please verify: 1) Backend is running, 2) API_URL is correct, 3) Device can reach the server`;
                console.error(msg);
                throw new Error(msg);
            }
            throw error;
        }
    },

    register: async ({ email, password, fullName, age, bio, categoryIds, imageUri }) => {
        try {
            console.log('Registering with API URL:', API_URL);

            const filename = imageUri.split('/').pop() || 'profile.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            const formData = new FormData();
            formData.append('email', email.trim().toLowerCase());
            formData.append('password', password);
            formData.append('full_name', fullName.trim());
            formData.append('age', String(age));
            formData.append('bio', bio.trim());
            formData.append('category_ids', JSON.stringify(categoryIds));
            formData.append('profile_picture', {
                uri: imageUri,
                name: filename,
                type,
            } as any);

            const response = await fetchWithTimeout(`${API_URL}/auth/register`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Registration failed with status ${response.status}:`, errorText);
                try {
                    const errorData = JSON.parse(errorText);
                    throw new Error(errorData.detail || 'Registration failed');
                } catch {
                    throw new Error(`Registration failed: ${response.status}`);
                }
            }

            const data = await response.json();
            const token = data.access_token as string;
            const backendUser = data.user as BackendUser;
            const newUser = mapBackendUserToAppUser(backendUser);
            console.log('Registration successful');

            set({
                isAuthenticated: true,
                token,
                user: newUser,
            });

            Promise.allSettled([
                secureStoreSetItem('joinme_token', token),
                secureStoreSetItem('joinme_userData', JSON.stringify(newUser)),
            ]).catch((storeError) => {
                console.error('SecureStore register write failed:', storeError);
            });

            registerForPushNotifications(token).catch((err) => {
                console.warn('Push token registration failed:', err);
            });
        } catch (error) {
            console.error('Registration error:', error);
            if (error instanceof TypeError) {
                console.error('Network error - likely cannot reach API at:', API_URL);
                console.error('Make sure EXPO_PUBLIC_API_URL in .env.local is set correctly for your device');
            }
            throw error;
        }
    },

    logout: async () => {
        try {
            // Clear auth state immediately
            set({
                isAuthenticated: false,
                user: null,
                token: null,
            });
            
            // Delete from storage in background (non-blocking)
            Promise.allSettled([
                secureStoreDeleteItem('joinme_token'),
                secureStoreDeleteItem('joinme_userData'),
            ]).catch((error) => {
                console.error('SecureStore delete error:', error);
            });
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    },

    restoreSession: async () => {
        try {
            // Retrieve token and user data
            const token = await secureStoreGetItem('joinme_token');
            const userJson = await secureStoreGetItem('joinme_userData');

            if (token && userJson) {
                const user = JSON.parse(userJson) as AppUser;
                set({
                    isAuthenticated: true,
                    user,
                    token,
                });
                registerForPushNotifications(token).catch((err) => {
                    console.warn('Push token registration failed:', err);
                });
            }
        } catch (error) {
            console.error('Restore session error:', error);
        }
    },
}));
