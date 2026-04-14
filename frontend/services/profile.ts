import apiRequest from './api';
import { BackendUser, mapBackendUserToAppUser, AppUser } from './user';

type BackendPreference = {
  user_id: number;
  category_id: number;
  category_name?: string | null;
};

export type ProfileData = {
  user: AppUser;
  interests: string[];
};

export async function fetchCurrentUser(token: string): Promise<AppUser> {
  const user = await apiRequest<BackendUser>('/users/me', { token });
  return mapBackendUserToAppUser(user);
}

export async function fetchUserById(userId: number): Promise<AppUser> {
  const user = await apiRequest<BackendUser>(`/users/${userId}`);
  return mapBackendUserToAppUser(user);
}

export async function fetchMyInterests(token: string): Promise<string[]> {
  const preferences = await apiRequest<BackendPreference[]>('/preferences/', { token });
  return preferences
    .map((preference) => preference.category_name?.trim() || '')
    .filter(Boolean);
}

export async function fetchUserInterestsById(userId: number): Promise<string[]> {
  const preferences = await apiRequest<BackendPreference[]>(`/preferences/user/${userId}`);
  return preferences
    .map((preference) => preference.category_name?.trim() || '')
    .filter(Boolean);
}

export async function fetchProfileData(token: string): Promise<ProfileData> {
  const [user, interests] = await Promise.all([
    fetchCurrentUser(token),
    fetchMyInterests(token),
  ]);

  return {
    user,
    interests,
  };
}