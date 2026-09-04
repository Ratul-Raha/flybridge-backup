import mongoose from "mongoose";
import { User } from "./models/user";
import { Seminar, SeminarRegistration } from "./models/seminar";
import { ResourceDownload } from "./models/resource-download";
import { Resource } from "./models/resource";
import { ReadinessRun } from "./models/readiness-run";
import { Course } from "./models/course";
import { Order } from "./models/order";
import { CourseEnrollment } from "./models/enrollment";
import { CourseProgress } from "./models/course-progress";
import { QuizAttempt } from "./models/quiz-attempt";
import { BotConfig } from "./models/bot-config";
import { BotTool } from "./models/bot-tool";
import { BotRule } from "./models/bot-rule";
import { BotKnowledge } from "./models/bot-knowledge";
import { BotConversation } from "./models/bot-conversation";
import { BotMessage } from "./models/bot-message";
import { BotAccess } from "./models/bot-access";
import { BotAuditLog } from "./models/bot-audit-log";

void User;
void Seminar;
void SeminarRegistration;
void ResourceDownload;
void Resource;
void ReadinessRun;
void Course;
void Order;
void CourseEnrollment;
void CourseProgress;
void QuizAttempt;
void BotConfig;
void BotTool;
void BotRule;
void BotKnowledge;
void BotConversation;
void BotMessage;
void BotAccess;
void BotAuditLog;

const uri = process.env.MONGODB_URI ?? "";
const dbName = process.env.MONGODB_DB ?? "flybridge";

declare global {
  // eslint-disable-next-line no-var
  var _mongoose: {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Connection> | null;
    listeners: boolean;
  } | undefined;
}

type Cache = NonNullable<typeof globalThis._mongoose>;

const cached: Cache =
  globalThis._mongoose ?? { conn: null, promise: null, listeners: false };
globalThis._mongoose = cached;

function attachConnectionListeners(conn: mongoose.Connection) {
  if (cached.listeners) return;
  cached.listeners = true;
  const reset = () => {
    cached.conn = null;
    cached.promise = null;
  };
  conn.on("disconnected", reset);
  conn.on("close", reset);
}

export async function connectDb(): Promise<mongoose.Connection> {
  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }

  if (cached.conn && cached.conn.readyState === 1) {
    return cached.conn;
  }

  if (cached.conn) {
    cached.conn = null;
    cached.promise = null;
  }

  cached.promise ??= mongoose
    .connect(uri, {
      dbName,
      maxIdleTimeMS: 60_000,
      serverSelectionTimeoutMS: 10_000,
      maxPoolSize: 10,
      family: 4,
    })
    .then((m) => m.connection);

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  attachConnectionListeners(cached.conn);
  return cached.conn;
}
