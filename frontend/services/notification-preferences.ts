import { apiRequest } from './api';

export type ChannelPrefs = {
    in_app_enabled: boolean;
    push_enabled: boolean;
};

export type TypePrefs = ChannelPrefs & {
    notification_type: string;
};

export type NotificationPreferences = {
    master: ChannelPrefs;
    per_type: TypePrefs[];
};

export async function fetchNotificationPreferences(
    token: string,
): Promise<NotificationPreferences> {
    return apiRequest<NotificationPreferences>('/preferences/notifications', {
        token,
    });
}

export async function updateNotificationPreference(
    token: string,
    update: {
        notification_type: string;
        in_app_enabled?: boolean;
        push_enabled?: boolean;
    },
): Promise<TypePrefs> {
    return apiRequest<TypePrefs>('/preferences/notifications', {
        method: 'PATCH',
        body: JSON.stringify(update),
        token,
    });
}
