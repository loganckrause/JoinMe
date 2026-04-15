import apiRequest from './api';

const EVENT_IMAGE_FALLBACK =
  'https://placehold.net/400x400.png';

export type BackendEvent = {
  id: number;
  creator_id: number;
  category_id: number;
  category_name?: string | null;
  title: string;
  description: string;
  event_date: string;
  max_capacity: number;
  location: string;
  latitude: number;
  longitude: number;
  event_picture?: string | null;
};

export type EventCard = {
  id: number;
  creatorId: number;
  categoryId: number;
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

function toImageUri(rawPicture?: string | null): string {
  if (!rawPicture) {
    return EVENT_IMAGE_FALLBACK;
  }

  if (rawPicture.startsWith('http://') || rawPicture.startsWith('https://')) {
    return rawPicture;
  }

  if (rawPicture.startsWith('data:image/')) {
    return rawPicture;
  }

  return `data:image/jpeg;base64,${rawPicture}`;
}

export function mapBackendEventToCard(event: BackendEvent): EventCard {
  const categoryLabel = event.category_name?.trim() || `Category ${event.category_id}`;

  return {
    id: event.id,
    creatorId: event.creator_id,
    categoryId: event.category_id,
    title: event.title,
    description: event.description,
    location: event.location,
    image: toImageUri(event.event_picture),
    number: String(event.max_capacity),
    eventDate: event.event_date,
    latitude: event.latitude,
    longitude: event.longitude,
    interests: [categoryLabel],
  };
}

export async function fetchEvents(): Promise<EventCard[]> {
  const events = await apiRequest<BackendEvent[]>('/events/');
  return events.map(mapBackendEventToCard);
}

export async function fetchAcceptedEvents(token?: string): Promise<EventCard[]> {
  console.log('Fetching accepted events with token:', token);
  const events = await apiRequest<BackendEvent[]>('/events/me/events', {
    token,
  });
  return events.map(mapBackendEventToCard);
}

export function getUserImageUri(user: EventUser | null): string {
  //Placeholder for now
    return EVENT_IMAGE_FALLBACK;
}

export async function fetchEventParticipants(eventId: number, creatorId: number): Promise<EventParticipants> {
  const [organizer, attendees] = await Promise.all([
    apiRequest<EventUser>(`/users/${creatorId}`),
    apiRequest<EventUser[]>(`/events/${eventId}/attendees`),
  ]);

  return {
    organizer,
    attendees,
  };
}