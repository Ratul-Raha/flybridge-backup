import mongoose from "mongoose";

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
  cached.conn = await cached.promise;
  return cached.conn;
}
