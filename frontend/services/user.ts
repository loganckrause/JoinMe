export const DEFAULT_AVATAR_URI =
  'https://placehold.net/400x400.png';

export type BackendUser = {
  id: number;
  name: string;
  email: string;
  bio?: string | null;
  age?: number | null;
  user_picture?: string | null;
  rating_score: number;
};

export type AppUser = {
  id: number;
  name: string;
  email: string;
  bio?: string;
  age?: number;
  user_picture?: string | null;
  photoUri?: string | null;
  rating_score: number;
};

export function toImageUri(rawPicture?: string | null): string {
  if (!rawPicture) {
    return DEFAULT_AVATAR_URI;
  }

  if (rawPicture.startsWith('http://') || rawPicture.startsWith('https://')) {
    return rawPicture;
  }

  if (rawPicture.startsWith('data:image/')) {
    return rawPicture;
  }

  return `data:image/jpeg;base64,${rawPicture}`;
}

export function mapBackendUserToAppUser(user: BackendUser): AppUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    bio: user.bio ?? undefined,
    age: user.age ?? undefined,
    user_picture: user.user_picture ?? null,
    photoUri: toImageUri(user.user_picture),
    rating_score: user.rating_score ?? 5.0
  };
}

export function toSidebarUser(user: AppUser | null): { name: string; photoUri?: string | null } {
  if (!user) {
    return { name: 'Guest' };
  }

  return {
    name: user.name,
    photoUri: user.photoUri,
  };
}