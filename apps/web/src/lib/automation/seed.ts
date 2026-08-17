import "server-only";

import mongoose from "mongoose";
import { connectDb } from "@/lib/db";
import { Automation } from "@/lib/models/automation";
import { makeId } from "./graph";
import type { AutomationGraph, AutomationNode, ActionType } from "./types";
import type { EventName } from "@/lib/events/types";

const SEED_KEY = "automations-v3";

function actionNode(actionType: ActionType, data: Record<string, unknown>): AutomationNode {
  return { id: makeId("action"), type: "action", data: { actionType, ...data } };
}

function emailToAllUsers(templateId: string): AutomationNode {
  return actionNode("send_email", {
    to: { mode: "role", value: "all" },
    templateId,
  });
}

function buildFlow(
  event: EventName,
  steps: AutomationNode[]
): { nodes: AutomationNode[]; edges: AutomationGraph["edges"] } {
  const trigger: AutomationNode = { id: makeId("trigger"), type: "trigger", data: { event } };
  const end: AutomationNode = { id: makeId("end"), type: "end", data: {} };
  const all = [trigger, ...steps, end];
  const edges = all.slice(0, -1).map((n, i) => ({
    id: makeId("edge"),
    source: n.id,
    target: all[i + 1].id,
  }));
  return { nodes: all, edges };
}

const DEFAULT_AUTOMATIONS: {
  name: string;
  description: string;
  event: EventName;
  steps: AutomationNode[];
}[] = [
  {
    name: "Welcome email",
    description: "Email a warm welcome when a brand new account registers.",
    event: "user.registered",
    steps: [
      actionNode("send_email", {
        to: { mode: "path", value: "user.email" },
        templateId: "welcome",
      }),
    ],
  },
  {
    name: "Registration confirmation",
    description: "Email the registrant a confirmation when they register for a seminar.",
    event: "seminar.registration_created",
    steps: [
      actionNode("send_email", {
        to: { mode: "path", value: "user.email" },
        templateId: "registration-confirmation",
      }),
    ],
  },
  {
    name: "Seminar announcement",
    description: "Email every user when a new seminar is published.",
    event: "seminar.created",
    steps: [emailToAllUsers("seminar-announcement")],
  },
  {
    name: "Resource announcement",
    description: "Email every user when a new resource is published.",
    event: "resource.created",
    steps: [emailToAllUsers("resource-announcement")],
  },
  {
    name: "Course announcement",
    description: "Email every user when a new course launches.",
    event: "course.launched",
    steps: [emailToAllUsers("course-announcement")],
  },
  {
    name: "Order confirmation",
    description: "Email the customer when their order is fulfilled.",
    event: "order.fulfilled",
    steps: [
      actionNode("send_email", {
        to: { mode: "path", value: "user.email" },
        templateId: "order-fulfilled",
      }),
    ],
  },
];

export async function seedDefaultAutomations(): Promise<void> {
  await connectDb();

  const seeds = mongoose.connection.collection("seeds");
  const done = await seeds.findOne({ key: SEED_KEY });
  if (done) return;

  for (const d of DEFAULT_AUTOMATIONS) {
    const flow = buildFlow(d.event, d.steps);
    // Upsert-by-name, but only patch docs whose email actions still lack a template so
    // older seeded automations get upgraded without clobbering admin edits.
    await Automation.findOneAndUpdate(
      { name: d.name, "nodes.data.templateId": { $exists: false } },
      {
        $set: {
          description: d.description,
          active: true,
          nodes: flow.nodes,
          edges: flow.edges,
        },
      },
      { upsert: true, new: true }
    );
  }

  await seeds.updateOne(
    { key: SEED_KEY },
    { $set: { key: SEED_KEY, at: new Date() } },
    { upsert: true }
  );
}