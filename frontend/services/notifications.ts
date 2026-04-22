import { apiRequest } from './api';

export interface Notification {
    id: number;
    user_id: number;
    event_id?: number | null;
    content: string;
    is_read: boolean;
    notification_type: string;
    created_at: string;
}

export async function fetchNotifications(
    token: string,
    limit = 20,
    offset = 0,
): Promise<Notification[]> {
    return apiRequest<Notification[]>(
        `/notifications/?limit=${limit}&offset=${offset}`,
        { token },
    );
}

export async function fetchUnreadCount(token: string): Promise<number> {
    const data = await apiRequest<{ unread_count: number }>(
        '/notifications/unread-count',
        { token },
    );
    return data.unread_count;
}

export async function markNotificationRead(
    token: string,
    id: number,
): Promise<Notification> {
    return apiRequest<Notification>(`/notifications/${id}/read`, {
        method: 'PATCH',
        token,
    });
}

export async function markAllNotificationsRead(
    token: string,
): Promise<number> {
    const data = await apiRequest<{ marked_read: number }>(
        '/notifications/mark-all-read',
        { method: 'POST', token },
    );
    return data.marked_read;
}

export async function respondToAttendancePoll(
    token: string,
    id: number,
    attended: boolean,
): Promise<void> {
    await apiRequest(`/notifications/${id}/respond?attended=${attended}`, {
        method: 'POST',
        token,
    });
}
