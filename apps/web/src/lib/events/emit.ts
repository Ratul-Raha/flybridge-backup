import "server-only";

import "@/lib/events";
import { connectDb } from "@/lib/db";
import { EventLog } from "@/lib/models/event-log";
import { getHandlers } from "./registry";
import { runAutomationsForEvent, type AutomationRunSummary } from "@/lib/automation/engine";
import { isEventName } from "./catalog";
import type { EventName, EventPayload } from "./types";

export type HandlerResult = { ok: boolean; error?: string };

export type EmitResult = {
  logId: string;
  handlers: Record<string, HandlerResult>;
  runs: AutomationRunSummary[];
};

export async function emitEvent(
  name: EventName,
  payload: EventPayload
): Promise<EmitResult> {
  if (!isEventName(name)) {
    console.error(`[events] unknown event: ${String(name)}`);
    return { logId: "", handlers: {}, runs: [] };
  }

  await connectDb();
  const log = await EventLog.create({ name, payload, status: "pending" });
  const logId = log._id.toString();
  const results: Record<string, HandlerResult> = {};

  for (const handler of getHandlers(name)) {
    const started = Date.now();
    try {
      await handler.run(payload, name);
      results[handler.name] = { ok: true };
      await EventLog.updateOne(
        { _id: log._id },
        {
          $push: {
            handlers: { name: handler.name, status: "success", durationMs: Date.now() - started },
          },
        }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Handler failed";
      console.error(`[events] handler "${handler.name}" for "${name}" failed:`, error);
      results[handler.name] = { ok: false, error: message };
      await EventLog.updateOne(
        { _id: log._id },
        {
          $push: {
            handlers: {
              name: handler.name,
              status: "failed",
              error: message,
              durationMs: Date.now() - started,
            },
          },
        }
      );
    }
  }

  let runs: AutomationRunSummary[] = [];
  try {
    runs = await runAutomationsForEvent(name, payload, logId);
  } catch (error) {
    console.error(`[events] automation execution for "${name}" failed:`, error);
  }

  const handlerValues = Object.values(results);
  const hasFailure = handlerValues.some((r) => !r.ok);
  await EventLog.updateOne(
    { _id: log._id },
    {
      $set: {
        status: hasFailure ? "partial" : "completed",
        automationsRun: runs.length,
      },
    }
  );

  return { logId, handlers: results, runs };
}
