import type { ComponentProps } from "react";
import { BookOpen, Megaphone, UserPlus, Zap } from "lucide-react";
import type { AppNotificationType } from "@/lib/notifications";

const ICONS: Record<AppNotificationType, typeof Megaphone> = {
  seminar_registration: UserPlus,
  seminar_created: Megaphone,
  course_launched: BookOpen,
  automation: Zap,
};

export function NotificationIcon({ type, ...props }: { type: AppNotificationType } & ComponentProps<typeof Megaphone>) {
  const Icon = ICONS[type] ?? Megaphone;
  return <Icon {...props} />;
}
