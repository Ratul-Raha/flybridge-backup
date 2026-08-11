export type AppNotificationType =
  | "seminar_registration"
  | "seminar_created"
  | "course_launched"
  | "automation";

export type AppNotification = {
  id: string;
  type: AppNotificationType;
  title: string;
  message: string;
  seminarId: string | null;
  registrationId: string | null;
  courseSlug: string | null;
  read: boolean;
  createdAt: string;
};

export type NotificationsResponse = {
  notifications: AppNotification[];
  unreadCount: number;
};