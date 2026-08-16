import type { EventName, EventPayload } from "./types";
import { EVENT_NAMES } from "./types";

export type EventCatalogEntry = {
  name: EventName;
  label: string;
  description: string;
  fields: string[];
  samplePayload: () => EventPayload;
};

const sampleUser = () => ({
  user: {
    id: "665f1c2a9e3b1c0012ab34cd",
    name: "Rahim Ahmed",
    email: "rahim@example.com",
    phone: "+8801712345678",
    accountType: "user",
    subscription: "free",
  },
});

const sampleSeminar = () => ({
  seminar: {
    id: "665f1c2a9e3b1c0012ab34cd",
    title: "Student Visa Blueprint — Live Q&A",
    description: "A practical session on preparing your study visa application.",
    dateTime: "2026-09-15T18:00:00.000Z",
    duration: "90 min",
    type: "free",
    price: 0,
    url: "https://meet.google.com/abc-defg-hij",
    image: "https://res.cloudinary.com/example/image/upload/seminar.jpg",
  },
});

export const EVENT_CATALOG: Record<EventName, EventCatalogEntry> = {
  "user.registered": {
    name: "user.registered",
    label: "User registered",
    description: "Fires when a brand new user account is created (Google or email sign-up).",
    fields: ["user.id", "user.name", "user.email", "user.phone", "user.accountType", "user.subscription"],
    samplePayload: sampleUser,
  },
  "seminar.registration_created": {
    name: "seminar.registration_created",
    label: "Seminar registered",
    description: "Fires when someone registers for a seminar.",
    fields: [
      "registrationId",
      "user.id",
      "user.name",
      "user.email",
      "user.phone",
      "seminar.id",
      "seminar.title",
      "seminar.description",
      "seminar.dateTime",
      "seminar.duration",
      "seminar.type",
      "seminar.price",
      "seminar.url",
      "seminar.image",
    ],
    samplePayload: () => ({ ...sampleSeminar(), registrationId: "665f1c2a9e3b1c0012ab34cd", ...sampleUser() }),
  },
  "seminar.created": {
    name: "seminar.created",
    label: "Seminar launched",
    description: "Fires when a new seminar is published.",
    fields: [
      "seminar.id",
      "seminar.title",
      "seminar.description",
      "seminar.dateTime",
      "seminar.duration",
      "seminar.type",
      "seminar.price",
      "seminar.url",
      "seminar.image",
    ],
    samplePayload: sampleSeminar,
  },
  "seminar.updated": {
    name: "seminar.updated",
    label: "Seminar updated",
    description: "Fires when an existing seminar is edited.",
    fields: ["seminar.id", "seminar.title"],
    samplePayload: () => ({ seminar: { id: "665f1c2a9e3b1c0012ab34cd", title: "Student Visa Blueprint — Live Q&A" } }),
  },
  "seminar.deleted": {
    name: "seminar.deleted",
    label: "Seminar deleted",
    description: "Fires when a seminar is deleted.",
    fields: ["seminar.id", "seminar.title"],
    samplePayload: () => ({ seminar: { id: "665f1c2a9e3b1c0012ab34cd", title: "Student Visa Blueprint — Live Q&A" } }),
  },
  "course.launched": {
    name: "course.launched",
    label: "Course launched",
    description: "Fires when a course is announced (manual trigger from the admin console).",
    fields: ["course.slug", "course.title", "course.desc", "course.badge", "course.price", "course.image"],
    samplePayload: () => ({
      course: { slug: "study-visa-prep-us", title: "Student Visa Blueprint™", desc: "Step-by-step study visa preparation.", badge: "STUDY ABROAD", price: "৳২,৯৯৯" },
    }),
  },
  "course.created": {
    name: "course.created",
    label: "Course published",
    description: "Fires when a new course is created in the admin console.",
    fields: ["course.id", "course.slug", "course.title", "course.badge", "course.price", "course.image"],
    samplePayload: () => ({
      course: { id: "665f1c2a9e3b1c0012ab34cd", slug: "study-visa-prep-us", title: "Student Visa Blueprint™", badge: "STUDY ABROAD", price: 2999 },
    }),
  },
  "course.updated": {
    name: "course.updated",
    label: "Course updated",
    description: "Fires when an existing course is edited.",
    fields: ["course.id", "course.slug", "course.title"],
    samplePayload: () => ({
      course: { id: "665f1c2a9e3b1c0012ab34cd", slug: "study-visa-prep-us", title: "Student Visa Blueprint™" },
    }),
  },
  "course.deleted": {
    name: "course.deleted",
    label: "Course deleted",
    description: "Fires when a course is deleted.",
    fields: ["course.id", "course.slug", "course.title"],
    samplePayload: () => ({
      course: { id: "665f1c2a9e3b1c0012ab34cd", slug: "study-visa-prep-us", title: "Student Visa Blueprint™" },
    }),
  },
  "course.enrolled": {
    name: "course.enrolled",
    label: "Course enrolled",
    description: "Fires when a user is enrolled in a course (via a fulfilled order).",
    fields: ["enrollmentId", "user.id", "user.name", "user.email", "course.id", "course.slug", "course.title", "course.price"],
    samplePayload: () => ({
      ...sampleUser(),
      enrollmentId: "665f1c2a9e3b1c0012ab34cd",
      course: { id: "665f1c2a9e3b1c0012ab34cd", slug: "study-visa-prep-us", title: "Student Visa Blueprint™", price: 2999 },
    }),
  },
  "order.created": {
    name: "order.created",
    label: "Order created",
    description: "Fires when a new order is created (any product type).",
    fields: ["order.id", "order.total", "order.currency", "order.status", "order.items", "user.id", "user.name", "user.email"],
    samplePayload: () => ({
      ...sampleUser(),
      order: {
        id: "665f1c2a9e3b1c0012ab34cd",
        total: 2999,
        currency: "BDT",
        status: "pending",
        items: [{ itemType: "course", itemId: "665f1c2a9e3b1c0012ab34cd", title: "Student Visa Blueprint™", price: 2999 }],
      },
    }),
  },
  "order.fulfilled": {
    name: "order.fulfilled",
    label: "Order fulfilled",
    description: "Fires when an order is paid and access is granted.",
    fields: ["order.id", "order.total", "order.currency", "order.status", "order.items", "user.id", "user.name", "user.email"],
    samplePayload: () => ({
      ...sampleUser(),
      order: {
        id: "665f1c2a9e3b1c0012ab34cd",
        total: 0,
        currency: "BDT",
        status: "paid",
        items: [{ itemType: "seminar", itemId: "665f1c2a9e3b1c0012ab34cd", title: "Student Visa Blueprint — Live Q&A", price: 0 }],
      },
    }),
  },
  "resource.created": {
    name: "resource.created",
    label: "Resource published",
    description: "Fires when a new resource (PDF, guide, video) is published.",
    fields: [
      "resource.id",
      "resource.title",
      "resource.description",
      "resource.category",
      "resource.fileType",
      "resource.thumbnail",
      "resource.access",
      "resource.price",
    ],
    samplePayload: () => ({
      resource: {
        id: "665f1c2a9e3b1c0012ab34cd",
        title: "Study Visa Checklist 2026",
        description: "Everything you need before applying.",
        category: "visa",
        fileType: "pdf",
        access: "free",
        price: 0,
      },
    }),
  },
};

export const EVENT_LIST: EventCatalogEntry[] = EVENT_NAMES.map((name) => EVENT_CATALOG[name]);

export function isEventName(value: unknown): value is EventName {
  return typeof value === "string" && (EVENT_NAMES as readonly string[]).includes(value);
}

export function eventLabel(name: string): string {
  return EVENT_CATALOG[name as EventName]?.label ?? name;
}
