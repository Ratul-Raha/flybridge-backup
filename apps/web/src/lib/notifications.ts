export type AppNotificationType = "seminar_registration";

export type AppNotification = {
  id: string;
  type: AppNotificationType;
  title: string;
  message: string;
  seminarId: string | null;
  registrationId: string | null;
  read: boolean;
  createdAt: string;
};

export type NotificationsResponse = {
  notifications: AppNotification[];
  unreadCount: number;
};