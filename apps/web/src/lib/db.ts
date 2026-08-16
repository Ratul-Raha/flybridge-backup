import mongoose from "mongoose";
import { User } from "./models/user";
import { Seminar, SeminarRegistration } from "./models/seminar";
import { ResourceDownload } from "./models/resource-download";
import { Resource } from "./models/resource";
import { ReadinessRun } from "./models/readiness-run";
import { Course } from "./models/course";
import { Order } from "./models/order";
import { CourseEnrollment } from "./models/enrollment";

void User;
void Seminar;
void SeminarRegistration;
void ResourceDownload;
void Resource;
void ReadinessRun;
void Course;
void Order;
void CourseEnrollment;

const uri = process.env.MONGODB_URI ?? "";
const dbName = process.env.MONGODB_DB ?? "flybridge";

declare global {
  // eslint-disable-next-line no-var
  var _mongoose: { conn: mongoose.Connection | null; promise: Promise<mongoose.Connection> | null } | undefined;
}

const cached = globalThis._mongoose ?? { conn: null, promise: null };
globalThis._mongoose = cached;

export async function connectDb(): Promise<mongoose.Connection> {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, { dbName }).then((m) => m.connection);
  }
  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
  return cached.conn;
}
