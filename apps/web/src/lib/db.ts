import mongoose from "mongoose";
import { User } from "./models/user";
import { Seminar, SeminarRegistration } from "./models/seminar";
import { ResourceDownload } from "./models/resource-download";
import { LinkClick } from "./models/link-click";
import { ResourceComment } from "./models/resource-comment";
import { ResourceLove } from "./models/resource-love";
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
import { PushSubscription } from "./models/push-subscription";
import { Blog } from "./models/blog";
import { AutomationPending } from "./models/automation-pending";
import { MockTest } from "./models/mock-test";
import { MockTestBundle } from "./models/mock-test-bundle";
import { MockTestEnrollment } from "./models/mock-test-enrollment";
import { MockTestAttempt } from "./models/mock-test-attempt";
import { Affiliate } from "./models/affiliate";
import { AffiliateClick } from "./models/affiliate-click";
import { AffiliateConversion } from "./models/affiliate-conversion";
import { AffiliatePayout } from "./models/affiliate-payout";
import { EmailClick } from "./models/email-click";
import { EmailSend } from "./models/email-send";
import { Lead } from "./models/lead";
import { LeadList } from "./models/lead-list";

void User;
void Seminar;
void SeminarRegistration;
void ResourceDownload;
void LinkClick;
void ResourceComment;
void ResourceLove;
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
void PushSubscription;
void Blog;
void AutomationPending;
void MockTest;
void MockTestBundle;
void MockTestEnrollment;
void MockTestAttempt;
void Affiliate;
void AffiliateClick;
void AffiliateConversion;
void AffiliatePayout;
void EmailClick;
void EmailSend;
void Lead;
void LeadList;

const uri = process.env.MONGODB_URI ?? "";
const dbName = process.env.MONGODB_DB ?? "flybridge";

declare global {
  // eslint-disable-next-line no-var
  var _mongoose:
    | {
        conn: mongoose.Connection | null;
        promise: Promise<mongoose.Connection> | null;
        listeners: boolean;
      }
    | undefined;
}

type Cache = NonNullable<typeof globalThis._mongoose>;

const cached: Cache = globalThis._mongoose ?? { conn: null, promise: null, listeners: false };
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
      // Serverless-friendly pooling: each Vercel function instance opens its
      // own pool, so keep sockets minimal and release idle ones quickly.
      maxPoolSize: 2,
      minPoolSize: 0,
      maxIdleTimeMS: 10_000,
      waitQueueTimeoutMS: 10_000,
      connectTimeoutMS: 10_000,
      serverSelectionTimeoutMS: 10_000,
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
