import apiRequest from './api';
import { API_URL } from './config';
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
  return { ...mapBackendUserToAppUser(user), city: (user as any).city, latitude: (user as any).latitude, longitude: (user as any).longitude } as AppUser;
}

export async function fetchUserById(userId: number): Promise<AppUser> {
  const user = await apiRequest<BackendUser>(`/users/${userId}`);
  return { ...mapBackendUserToAppUser(user), city: (user as any).city, latitude: (user as any).latitude, longitude: (user as any).longitude } as AppUser;
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

export async function updateProfile(
  token: string,
  data: { name?: string; bio?: string; age?: number; city?: string }
): Promise<AppUser> {
  const updatedUser = await apiRequest<BackendUser>('/users/me', {
    method: 'PATCH',
    token,
    body: JSON.stringify(data),
  });
  return { ...mapBackendUserToAppUser(updatedUser), city: (updatedUser as any).city, latitude: (updatedUser as any).latitude, longitude: (updatedUser as any).longitude } as AppUser;
}

export async function uploadProfilePicture(token: string, imageUri: string): Promise<{ message: string, url: string }> {
  const formData = new FormData();
  
  const filename = imageUri.split('/').pop() || 'profile.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('file', {
    uri: imageUri,
    name: filename,
    type,
  } as any);

  const response = await fetch(`${API_URL}/users/me/picture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Upload failed: ${response.statusText}`);
  }

  return response.json();
}