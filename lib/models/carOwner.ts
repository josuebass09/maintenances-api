export interface NotificationPreferences {
    emailEnabled: boolean;
    daysBeforeReminder: number[];
}

export interface CarOwner {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    notificationPreferences: NotificationPreferences;
}

export interface CarOwnerRequest {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    notificationPreferences?: Partial<NotificationPreferences>;
}

export enum CarOwnerKeys {
    PrimaryKey = 'id',
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
    emailEnabled: true,
    daysBeforeReminder: [30, 7, 1, 0],
};
