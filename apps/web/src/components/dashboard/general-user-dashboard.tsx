"use client";

import { useIsMobile } from "@/hooks/use-media-query";
import { ProfileDashboard } from "@/components/dashboard/profile-dashboard";
import { MobileProfileDashboard } from "@/components/dashboard/mobile-profile-dashboard";

export function GeneralUserDashboard() {
  const isMobile = useIsMobile();

  if (isMobile) return <MobileProfileDashboard />;
  return <ProfileDashboard />;
}