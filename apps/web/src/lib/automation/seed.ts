import "server-only";

import mongoose from "mongoose";
import { connectDb } from "@/lib/db";
import { Automation } from "@/lib/models/automation";
import { makeId, createEdge } from "./graph";
import type { AutomationGraph, AutomationNode, AutomationEdge, ActionType, ConditionOperator } from "./types";
import type { EventName } from "@/lib/events/types";

const SEED_KEY = "automations-v4";

function actionNode(actionType: ActionType, data: Record<string, unknown>): AutomationNode {
  return { id: makeId("action"), type: "action", data: { actionType, ...data } };
}

function condNode(field: string, operator: ConditionOperator, value: string): AutomationNode {
  return { id: makeId("cond"), type: "condition", data: { field, operator, value } };
}

function emailToAllUsers(templateId: string): AutomationNode {
  return actionNode("send_email", {
    to: { mode: "role", value: "all" },
    templateId,
  });
}

function emailToUser(templateId: string): AutomationNode {
  return actionNode("send_email", {
    to: { mode: "path", value: "user.email" },
    templateId,
  });
}

function delayNode(duration: number, unit: "days" | "minutes" = "days"): AutomationNode {
  return actionNode("delay", { duration, unit });
}

function buildFlow(
  event: EventName,
  steps: AutomationNode[]
): { nodes: AutomationNode[]; edges: AutomationEdge[] } {
  const trigger: AutomationNode = { id: makeId("trigger"), type: "trigger", data: { event } };
  const end: AutomationNode = { id: makeId("end"), type: "end", data: {} };
  const all = [trigger, ...steps, end];
  const edges = all.slice(0, -1).map((n, i) => createEdge(n.id, all[i + 1].id));
  return { nodes: all, edges };
}

/** 12-day nurture sequence: welcome → free course (day 3) → resources (day 6)
 *  → readiness (day 9) → certificate (day 12). Skip logic branches on the
 *  user's real activity so already-engaged users don't get nagged. */
function buildNurtureGraph(): AutomationGraph {
  const trigger: AutomationNode = { id: makeId("trigger"), type: "trigger", data: { event: "user.registered" } };
  const end: AutomationNode = { id: makeId("end"), type: "end", data: {} };

  const welcome = emailToUser("nurture-welcome");
  const course = emailToUser("nurture-course");
  const resources = emailToUser("nurture-resources");
  const readiness = emailToUser("nurture-readiness");
  const certificate = emailToUser("nurture-certificate");

  const d1 = delayNode(3);
  const d2 = delayNode(3);
  const d3 = delayNode(3);
  const d4 = delayNode(3);

  const enrolled = condNode("user.id", "has_enrolled", "easy-smart-spoken-english");
  const downloaded = condNode("user.id", "has_resource_download", "");
  const assessed = condNode("user.id", "has_readiness_run", "");
  const progressed = condNode("user.id", "progress_gte", "50");

  const nodes = [trigger, welcome, d1, enrolled, course, d2, downloaded, resources, d3, assessed, readiness, d4, progressed, certificate, end];
  const e = (source: AutomationNode, target: AutomationNode, handle?: "true" | "false") =>
    createEdge(source.id, target.id, handle);

  const edges = [
    e(trigger, welcome),
    e(welcome, d1),
    e(d1, enrolled),
    e(enrolled, d2, "true"),
    e(enrolled, course, "false"),
    e(course, d2),
    e(d2, downloaded),
    e(downloaded, d3, "true"),
    e(downloaded, resources, "false"),
    e(resources, d3),
    e(d3, assessed),
    e(assessed, d4, "true"),
    e(assessed, readiness, "false"),
    e(readiness, d4),
    e(d4, progressed),
    e(progressed, end, "true"),
    e(progressed, certificate, "false"),
    e(certificate, end),
  ];

  return { nodes, edges };
}

/** Sends the certificate push as soon as course progress crosses 50% — the
 *  "or" branch of Email 5 (Day 12 handled by the nurture sequence above). */
function buildProgressCertGraph(): AutomationGraph {
  const trigger: AutomationNode = { id: makeId("trigger"), type: "trigger", data: { event: "course.progress_updated" } };
  const end: AutomationNode = { id: makeId("end"), type: "end", data: {} };

  const half = condNode("user.id", "progress_gte", "50");
  const certified = condNode("user.id", "has_certificate", "");
  const sendCert = emailToUser("nurture-certificate");

  const nodes = [trigger, half, certified, sendCert, end];
  const e = (source: AutomationNode, target: AutomationNode, handle?: "true" | "false") =>
    createEdge(source.id, target.id, handle);

  const edges = [
    e(trigger, half),
    e(half, certified, "true"),
    e(half, end, "false"),
    e(certified, end, "true"),
    e(certified, sendCert, "false"),
    e(sendCert, end),
  ];

  return { nodes, edges };
}

type DefaultAutomation = {
  name: string;
  description: string;
  event: EventName;
  graph?: AutomationGraph;
  steps?: AutomationNode[];
};

const DEFAULT_AUTOMATIONS: DefaultAutomation[] = [
  {
    name: "Welcome email",
    description: "Email a warm welcome when a brand new account registers.",
    event: "user.registered",
    steps: [emailToUser("welcome")],
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
    name: "12-day onboarding nurture",
    description:
      "One sequence per new user: instant welcome, then the free course (day 3), free resources (day 6), readiness check (day 9) and certificate push (day 12). Each step skips users who've already done it.",
    event: "user.registered",
    graph: buildNurtureGraph(),
  },
  {
    name: "Certificate push at 50% progress",
    description: "Sends the certificate motivation email as soon as a learner's course progress crosses 50%.",
    event: "course.progress_updated",
    graph: buildProgressCertGraph(),
  },
];

export async function seedDefaultAutomations(): Promise<void> {
  await connectDb();

  const seeds = mongoose.connection.collection("seeds");
  const done = await seeds.findOne({ key: SEED_KEY });
  if (done) return;

  for (const d of DEFAULT_AUTOMATIONS) {
    // Only seed automations that don't already exist by name — admin edits win.
    const exists = await Automation.exists({ name: d.name });
    if (exists) continue;

    const flow = d.graph ?? buildFlow(d.event, d.steps ?? []);
    await Automation.create({
      name: d.name,
      description: d.description,
      active: true,
      nodes: flow.nodes,
      edges: flow.edges,
    });
  }

  // The nurture sequence sends its own welcome email on user.registered, so
  // deactivate the legacy one to avoid double emailing. One-time action (seed
  // key below) — an admin can re-enable it from the UI anytime.
  await Automation.updateOne(
    { name: "Welcome email" },
    { $set: { active: false } }
  );

  await seeds.updateOne(
    { key: SEED_KEY },
    { $set: { key: SEED_KEY, at: new Date() } },
    { upsert: true }
  );
}