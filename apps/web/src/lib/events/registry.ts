import type { EventName, EventPayload } from "./types";

export type EventHandler = {
  name: string;
  run: (payload: EventPayload, eventName: EventName) => Promise<void>;
};

const registry: Partial<Record<EventName, EventHandler[]>> = {};

export function on(event: EventName, handler: EventHandler): void {
  if (!registry[event]) registry[event] = [];
  registry[event]!.push(handler);
}

export function getHandlers(event: EventName): EventHandler[] {
  return registry[event] ?? [];
}
