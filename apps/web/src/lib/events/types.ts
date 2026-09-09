export const EVENT_NAMES = [
  "user.registered",
  "seminar.registration_created",
  "seminar.created",
  "seminar.updated",
  "seminar.deleted",
  "course.launched",
  "course.created",
  "course.updated",
  "course.deleted",
  "course.enrolled",
  "course.progress_updated",
  "order.created",
  "order.fulfilled",
  "resource.created",
  "scholarship.created",
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

export type SeminarPayload = {
  id: string;
  title: string;
  description?: string | null;
  dateTime?: string;
  duration?: string | null;
  type?: "free" | "paid";
  price?: number;
  url?: string | null;
  image?: string | null;
};

export type UserPayload = {
  id?: string;
  name: string;
  email: string;
  phone?: string | null;
  accountType?: string;
  subscription?: string;
};

export type ActorPayload = {
  userId?: string;
  name?: string;
  email?: string;
};

export type EventPayloadMap = {
  "user.registered": { user: UserPayload };
  "seminar.registration_created": {
    registrationId: string;
    user: UserPayload;
    seminar: SeminarPayload;
  };
  "seminar.created": { seminar: SeminarPayload; actor?: ActorPayload };
  "seminar.updated": {
    seminar: Pick<SeminarPayload, "id" | "title">;
    actor?: ActorPayload;
    changedFields?: string[];
  };
  "seminar.deleted": { seminar: Pick<SeminarPayload, "id" | "title">; actor?: ActorPayload };
  "course.launched": {
    course: {
      slug: string;
      title: string;
      desc?: string;
      badge?: string;
      price?: number;
      image?: string;
    };
  };
  "course.created": {
    course: {
      id: string;
      slug: string;
      title: string;
      badge?: string;
      price?: number;
      image?: string;
    };
    actor?: ActorPayload;
  };
  "course.updated": {
    course: { id: string; slug: string; title: string };
    actor?: ActorPayload;
    changedFields?: string[];
  };
  "course.deleted": {
    course: { id: string; slug: string; title: string };
    actor?: ActorPayload;
  };
  "course.enrolled": {
    enrollmentId: string;
    user: UserPayload;
    course: { id: string; slug: string; title: string; price?: number };
  };
  "course.progress_updated": {
    user: UserPayload;
    course: { id: string; slug: string; title: string };
    progress: { overallPercentage: number; passed: boolean; certificateIssued: boolean };
  };
  "order.created": {
    order: {
      id: string;
      total: number;
      currency: string;
      status: string;
      items: { itemType: string; itemId: string; title?: string; price?: number }[];
    };
    user: UserPayload;
  };
  "order.fulfilled": {
    order: {
      id: string;
      total: number;
      currency: string;
      status: string;
      items: { itemType: string; itemId: string; title?: string; price?: number }[];
    };
    user: UserPayload;
    course?: { slug: string; title: string };
  };
  "resource.created": {
    resource: {
      id: string;
      title: string;
      description?: string | null;
      category?: string;
      fileType?: string;
      thumbnail?: string | null;
      access?: "public" | "members";
      price?: number;
    };
    actor?: ActorPayload;
  };
  "scholarship.created": {
    scholarship: {
      id: string;
      institution: string;
      title: string;
      country?: string | null;
      countryCode?: string | null;
      level?: string;
      amount?: string | null;
      deadline?: string | null;
    };
    actor?: ActorPayload;
  };
};

export type EventPayload = Record<string, unknown>;
