import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type User = {
    id: number;
    name: string;
    email: string;
    bio?: string;
    age?: number;
    profile_pic?: string;
};

type AuthStore = {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, username: string) => Promise<void>;
    logout: () => Promise<void>;
    restoreSession: () => Promise<void>;
};

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

// Storage utilities that work on both web and native
const storage = {
    async setItem(key: string, value: string) {
        if (Platform.OS === 'web') {
            localStorage.setItem(key, value);
        } else {
            // On native platforms, use SecureStore
            try {
                await SecureStore.setItemAsync(key, value);
            } catch (error) {
                console.error('SecureStore setItem error:', error);
                throw error;
            }
        }
    },

    async getItem(key: string): Promise<string | null> {
        if (Platform.OS === 'web') {
            return localStorage.getItem(key);
        } else {
            try {
                return await SecureStore.getItemAsync(key);
            } catch (error) {
                console.error('SecureStore getItem error:', error);
                return null;
            }
        }
    },

    async removeItem(key: string) {
        if (Platform.OS === 'web') {
            localStorage.removeItem(key);
        } else {
            try {
                await SecureStore.deleteItemAsync(key);
            } catch (error) {
                console.error('SecureStore removeItem error:', error);
            }
        }
    },

    async setUserData(userData: string) {
        if (Platform.OS === 'web') {
            localStorage.setItem('user', userData);
        } else {
            try {
                await SecureStore.setItemAsync('user', userData);
            } catch (error) {
                console.error('SecureStore setUserData error:', error);
                throw error;
            }
        }
    },

    async getUserData(): Promise<string | null> {
        if (Platform.OS === 'web') {
            return localStorage.getItem('user');
        } else {
            try {
                return await SecureStore.getItemAsync('user');
            } catch (error) {
                console.error('SecureStore getUserData error:', error);
                return null;
            }
        }
    },

    async removeUserData() {
        if (Platform.OS === 'web') {
            localStorage.removeItem('user');
        } else {
            try {
                await SecureStore.deleteItemAsync('user');
            } catch (error) {
                console.error('SecureStore removeUserData error:', error);
            }
        }
    },
};

export const useAuthStore = create<AuthStore>((set) => ({
    isAuthenticated: false,
    user: null,
    token: null,

    login: async (email: string, password: string) => {
        try {
            console.log('Logging in with API URL:', API_URL);
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    username: email,
                    password: password,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Login failed with status ${response.status}:`, errorText);
                throw new Error(`Login failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const token = data.access_token;
            console.log('Login successful, fetching user profile...');

            // Fetch user profile
            const userResponse = await fetch(`${API_URL}/users/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!userResponse.ok) {
                const errorText = await userResponse.text();
                console.error(`Failed to fetch user profile ${userResponse.status}:`, errorText);
                throw new Error(`Failed to fetch user profile: ${userResponse.status}`);
            }

            const user = await userResponse.json();
            console.log('User profile fetched successfully');
            
            // Store token and user data securely
            await storage.setItem('token', token);
            await storage.setUserData(JSON.stringify(user));

            set({
                isAuthenticated: true,
                user,
                token,
            });
        } catch (error) {
            console.error('Login error:', error);
            if (error instanceof TypeError) {
                console.error('Network error - likely cannot reach API at:', API_URL);
                console.error('Make sure EXPO_PUBLIC_API_URL in .env.local is set correctly for your device');
            }
            throw error;
        }
    },

    register: async (email: string, password: string, username: string) => {
        try {
            console.log('Registering with API URL:', API_URL);
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    username,
                }),
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
            const newUser = {
                id: data.user_id,
                name: username,
                email,
            };
            console.log('Registration successful');
            
            // Store user data
            await storage.setUserData(JSON.stringify(newUser));
            
            set({ user: newUser });
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
            // Remove token and user data
            await storage.removeItem('token');
            await storage.removeUserData();
            
            set({
                isAuthenticated: false,
                user: null,
                token: null,
            });
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    },

    restoreSession: async () => {
        try {
            // Retrieve token and user data
            const token = await storage.getItem('token');
            const userJson = await storage.getUserData();

            if (token && userJson) {
                const user = JSON.parse(userJson);
                set({
                    isAuthenticated: true,
                    user,
                    token,
                });
            }
        } catch (error) {
            console.error('Restore session error:', error);
        }
    },
}));
