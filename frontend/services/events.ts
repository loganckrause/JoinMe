import apiRequest from './api';

const EVENT_IMAGE_FALLBACK =
  'https://placehold.net/400x400.png';

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
  location: string;
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
    isAccepted: event.is_accepted ?? false,
  };
}

export async function fetchEvents(token?: string): Promise<EventCard[]> {
  const events = await apiRequest<BackendEvent[]>('/events/', {
    token,
  });
  return events.map(mapBackendEventToCard);
}

export async function fetchEvent(eventId: number, token?: string): Promise<EventCard> {
  const event = await apiRequest<BackendEvent>(`/events/${eventId}`, {
    token,
  });

  return mapBackendEventToCard(event);
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

export async function fetchAcceptedEvents(token?: string): Promise<EventCard[]> {
  const events = await apiRequest<BackendEvent[]>('/swipes/accepted', {
    token,
  });
  return events.map((event) => ({
    ...mapBackendEventToCard(event),
    isAccepted: true,
  }));
}

export function getUserImageUri(user: EventUser | null): string {
    return toImageUri(user?.user_picture);
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