import Constants from 'expo-constants';

function getHostFromExpoConfig(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) {
    return null;
  }

  const host = hostUri.split(':')[0];
  return host || null;
}

export function getApiUrl(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configuredUrl) {
    return configuredUrl;
  }

  const host = getHostFromExpoConfig();
  if (host) {
    return `http://${host}:8000`;
  }

  return 'http://localhost:8000';
}

export const API_URL = getApiUrl();
