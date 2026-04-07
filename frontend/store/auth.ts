import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/services/config';

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

export const useAuthStore = create<AuthStore>((set) => ({
    isAuthenticated: false,
    user: null,
    token: null,

    login: async (email: string, password: string) => {
        try {
            const loginPayload = new URLSearchParams({
                username: email.trim(),
                password,
            }).toString();

            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                },
                body: loginPayload,
            });

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

            // Fetch user profile
            const userResponse = await fetch(`${API_URL}/users/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!userResponse.ok) {
                throw new Error('Failed to fetch user profile');
            }

            const user = await userResponse.json();
            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('user', JSON.stringify(user));

            set({
                isAuthenticated: true,
                user,
                token,
            });
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    register: async (email: string, password: string, username: string) => {
        try {
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
                const error = await response.json();
                throw new Error(error.detail || 'Registration failed');
            }

            const data = await response.json();
            const newUser = {
                id: data.user_id,
                name: username,
                email,
            };

            await AsyncStorage.setItem('user', JSON.stringify(newUser));
            set({ user: newUser });
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    },

    logout: async () => {
        try {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
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
            const token = await AsyncStorage.getItem('token');
            const userJson = await AsyncStorage.getItem('user');

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
