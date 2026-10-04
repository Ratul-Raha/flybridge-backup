export type AppNotificationType =
  | "user_registered"
  | "seminar_registration"
  | "seminar_created"
  | "course_launched"
  | "resource_created"
  | "scholarship_created"
  | "order_created"
  | "order_fulfilled"
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