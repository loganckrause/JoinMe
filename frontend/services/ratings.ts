import { apiRequest } from './api';
import type { AppUser } from './user';
import type { EventCard } from './events';

export async function fetchEventForRating(
    token: string,
    eventId: number,
): Promise<EventCard> {
    const data = await apiRequest<any>(`/events/${eventId}`, { token });
    return {
        ...data,
        image: data.event_picture || null,
    };
}

export async function fetchEventParticipants(
    token: string,
    eventId: number,
): Promise<AppUser[]> {
    return apiRequest<AppUser[]>(`/events/${eventId}/attendees`, { token });
}

export async function submitEventRating(
    token: string,
    eventId: number,
    rating: number,
): Promise<void> {
    await apiRequest(`/event-ratings/`, {
        method: 'POST',
        token,
        body: JSON.stringify({ event_id: eventId, score: rating, review: "" }),
    });
}

export async function submitUserRating(
    token: string,
    rateeId: number,
    eventId: number,
    rating: number,
): Promise<void> {
    await apiRequest(`/user-ratings/`, {
        method: 'POST',
        token,
        body: JSON.stringify({ ratee_id: rateeId, score: rating, comment: "" }),
    });
}