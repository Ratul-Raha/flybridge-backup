import "server-only";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const S3_REGION = process.env.AWS_REGION ?? "eu-north-1";
export const S3_BUCKET = process.env.S3_BUCKET ?? "";

export type StorageScope = "courses" | "resources" | "stories" | "scholarships" | "blogs" | "mock-tests";
export type StorageKind = "image" | "pdf" | "video" | "audio" | "file";
export type Visibility = "public" | "private";

let memoClient: S3Client | null = null;

export function s3Client(): S3Client {
  if (memoClient) return memoClient;
  memoClient = new S3Client({
    region: S3_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
    },
  });
  return memoClient;
}

export function isS3Configured(): boolean {
  return Boolean(
    S3_BUCKET && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
  );
}

export function slugifyFileName(name: string): string {
  const base = name.replace(/\.[^.]+$/, "").toLowerCase();
  const slug = base
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${slug || "file"}-${rand}`;
}

export function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i + 1).toLowerCase();
}

export function kindOf(name: string): StorageKind {
  if (/\.(png|jpe?g|webp|gif|svg)$/i.test(name)) return "image";
  if (/\.(mp4|mov|webm)$/i.test(name)) return "video";
  if (/\.(mp3|wav|m4a|aac)$/i.test(name)) return "audio";
  if (extOf(name) === "pdf") return "pdf";
  return "file";
}

/** Visibility split: marketing images are public; tutorials, documents,
 *  videos and audio are private (auth-gated via signed URLs). */
export function visibilityFor(
  scope: StorageScope,
  kind: StorageKind,
  use?: "file" | "thumbnail"
): Visibility {
  if (scope === "resources") return use === "thumbnail" ? "public" : "private";
  if (kind === "image") return "public";
  return "private";
}

export function buildKey(
  scope: StorageScope,
  fileName: string,
  use?: "file" | "thumbnail"
): string {
  const kind = kindOf(fileName);
  const visibility = visibilityFor(scope, kind, use);
  const group =
    use === "thumbnail"
      ? "thumbnails"
      : kind === "image"
      ? "images"
      : kind === "video"
      ? "videos"
      : kind === "pdf"
      ? "pdfs"
      : kind === "audio"
      ? "audio"
      : "files";
  return `${visibility}/${scope}/${group}/${slugifyFileName(fileName)}.${extOf(fileName)}`;
}

export function publicObjectUrl(key: string): string {
  return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
}

export function privateRef(key: string): string {
  return `s3://${S3_BUCKET}/${key}`;
}

export function makeRef(key: string, visibility: Visibility): string {
  return visibility === "public" ? publicObjectUrl(key) : privateRef(key);
}

export async function presignPutUrl(
  key: string,
  contentType: string,
  size: number
): Promise<string> {
  return getSignedUrl(
    s3Client(),
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: contentType,
      ContentLength: size,
    }),
    { expiresIn: 15 * 60 }
  );
}

export async function presignGetUrl(
  key: string,
  ttlSeconds = 6 * 60 * 60,
  options?: { contentDisposition?: string; contentType?: string }
): Promise<string> {
  return getSignedUrl(
    s3Client(),
    new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ...(options?.contentDisposition
        ? { ResponseContentDisposition: options.contentDisposition }
        : {}),
      ...(options?.contentType ? { ResponseContentType: options.contentType } : {}),
    }),
    { expiresIn: ttlSeconds }
  );
}

export async function deleteObject(key: string): Promise<void> {
  await s3Client().send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
}