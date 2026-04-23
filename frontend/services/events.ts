import apiRequest from './api';
import { Platform } from 'react-native';

const EVENT_IMAGE_FALLBACK = 'https://placehold.net/400x400.png';

export type BackendEvent = {
  id: number;
  creator_id: number;
  category_id: number;
  category_name?: string | null;
  is_accepted?: boolean | null;
  title: string;
  description: string;
  event_date: string;
  max_capacity: number;
  street: string;
  city: string;
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
  event_picture?: string | null;
};

export type EventCard = {
  id: number;
  creatorId: number;
  categoryId: number;
  isAccepted?: boolean;
  title: string;
  description: string;
  location: string;
  image: string;
  number: string;
  eventDate: string;
  latitude: number;
  longitude: number;
  interests: string[];
};

export type EventUser = {
  id: number;
  name: string;
  age?: number | null;
  bio?: string | null;
  user_picture?: string | null;
};

export type EventParticipants = {
  organizer: EventUser | null;
  attendees: EventUser[];
};

export type EventFilters = {
  categoryId?: number;
  dateFrom?: string;
  dateTo?: string;
  radius?: number;
};

export type Category = {
  id: number;
  name: string;
};

export type CreateEventPayload = {
  title: string;
  description: string;
  event_date: string;
  max_capacity: number;
  street: string;
  city: string;
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
  category_id: number;
  event_picture?: string | null;
};

function toImageUri(rawPicture?: string | null): string {
  if (!rawPicture) return EVENT_IMAGE_FALLBACK;
  if (rawPicture.startsWith('http://') || rawPicture.startsWith('https://')) return rawPicture;
  if (rawPicture.startsWith('data:image/')) return rawPicture;
  return `data:image/jpeg;base64,${rawPicture}`;
}

export function mapBackendEventToCard(event: BackendEvent): EventCard {
  const categoryLabel = event.category_name?.trim() || `Category ${event.category_id}`;
  const locationStr = [event.street, event.city, event.state, event.zip].filter(Boolean).join(', ');

  return {
    id: event.id,
    creatorId: event.creator_id,
    categoryId: event.category_id,
    title: event.title,
    description: event.description,
    location: locationStr || 'Location not provided',
    image: toImageUri(event.event_picture),
    number: String(event.max_capacity),
    eventDate: event.event_date,
    latitude: event.latitude,
    longitude: event.longitude,
    interests: [categoryLabel],
    isAccepted: event.is_accepted ?? false,
  };
}

// RESOLVED: kept new signature with radius + filters, removed old token-only version
export async function fetchEvents(radius: number, token: string | null, filters: EventFilters = {}): Promise<EventCard[]> {
  const params = new URLSearchParams();
  params.set('radius', String(radius));
  if (filters.categoryId != null) params.set('category_id', String(filters.categoryId));
  if (filters.dateFrom) params.set('date_from', filters.dateFrom);
  if (filters.dateTo) params.set('date_to', filters.dateTo);
  const qs = params.toString();
  const events = await apiRequest<BackendEvent[]>(`/events/?${qs}`, { token });
  return events.map(mapBackendEventToCard);
}

export async function fetchEvent(eventId: number, token?: string): Promise<EventCard> {
  const event = await apiRequest<BackendEvent>(`/events/${eventId}`, { token });
  return mapBackendEventToCard(event);
}

export async function fetchAcceptedEvents(token?: string): Promise<EventCard[]> {
  // Add a timestamp to bypass aggressive fetch caching on React Native
  const events = await apiRequest<BackendEvent[]>(`/events/me/events?_t=${Date.now()}`, { token });
  return events.map(mapBackendEventToCard);
}

export async function fetchEventsHosted(token?: string, userId?: number): Promise<EventCard[]> {
  // Add a timestamp to bypass aggressive fetch caching on React Native
  const query = userId ? `?userId=${userId}` : '';
  const events = await apiRequest<BackendEvent[]>(`/events/hosted${query}`, { token });
  return events.map(mapBackendEventToCard);
}

export async function createEvent(payload: CreateEventPayload, token: string | null): Promise<EventCard> {
  const createdEvent = await apiRequest<BackendEvent>('/events/', {
    token: token ?? undefined,
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return mapBackendEventToCard(createdEvent);
}

export async function uploadEventPicture(token: string, eventId: number, photoUri: string): Promise<void> {
  const formData = new FormData();
  const filename = photoUri.split('/').pop() || `event_${eventId}.jpg`;
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : `image/jpeg`;

  formData.append('file', {
    uri: Platform.OS === 'ios' ? photoUri.replace('file://', '') : photoUri,
    name: filename,
    type,
  } as any);

  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
  const response = await fetch(`${apiUrl}/events/${eventId}/picture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload event picture');
  }
}

export async function fetchCategories(): Promise<Category[]> {
  return apiRequest<Category[]>('/categories/');
}

export async function recordSwipe(eventId: number, status: boolean, token?: string): Promise<void> {
  await apiRequest(`/swipes/?event_id=${eventId}&status=${status}`, {
    method: 'POST',
    token,
  });
}

export async function deleteEvent(eventId: number, token?: string): Promise<void> {
  await apiRequest(`/events/${eventId}`, {
    method: 'DELETE',
    token,
  });
}

export function getUserImageUri(user: EventUser | null): string {
  return toImageUri(user?.user_picture);
}

export async function fetchEventParticipants(eventId: number, creatorId: number): Promise<EventParticipants> {
  const [organizer, attendees] = await Promise.all([
    apiRequest<EventUser>(`/users/${creatorId}`),
    apiRequest<EventUser[]>(`/events/${eventId}/attendees`),
  ]);
  return { organizer, attendees };
}