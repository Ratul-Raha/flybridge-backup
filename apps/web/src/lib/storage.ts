import "server-only";
import type { GetObjectCommandOutput } from "@aws-sdk/client-s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { destroyAsset } from "./cloudinary";
import { S3_BUCKET, isS3Configured, presignGetUrl, deleteObject, s3Client } from "./s3";

export function parseS3Ref(ref: string): { bucket: string; key: string } | null {
  if (!ref.startsWith("s3://")) return null;
  const rest = ref.slice("s3://".length);
  const slash = rest.indexOf("/");
  if (slash === -1) return null;
  return { bucket: rest.slice(0, slash), key: rest.slice(slash + 1) };
}

export function isS3Ref(ref?: string | null): boolean {
  return Boolean(ref && ref.startsWith("s3://"));
}

/** A bare object key stored directly (e.g. in a `publicId` field). */
export function isS3Key(ref?: string | null): boolean {
  return Boolean(ref && (ref.startsWith("public/") || ref.startsWith("private/")));
}

export function s3KeyOf(ref: string): string {
  const parsed = parseS3Ref(ref);
  return parsed ? parsed.key : ref;
}

/** Sign a private S3 ref for playback/download (no-op for legacy http URLs). */
export async function signMediaUrl(ref?: string | null, ttlSeconds = 6 * 60 * 60): Promise<string> {
  if (!ref || !isS3Ref(ref) || !isS3Configured()) return ref ?? "";
  return presignGetUrl(s3KeyOf(ref), ttlSeconds);
}

export async function getS3Object(
  ref: string
): Promise<{
  stream: ReadableStream | null;
  contentLength?: number;
  contentType?: string;
}> {
  const output: GetObjectCommandOutput = await s3Client().send(
    new GetObjectCommand({ Bucket: S3_BUCKET, Key: s3KeyOf(ref) })
  );
  const body = output.Body as (GetObjectCommandOutput["Body"] & { transformToWebStream?: () => ReadableStream }) | undefined;
  const stream = body?.transformToWebStream
    ? body.transformToWebStream()
    : null;
  return { stream, contentLength: output.ContentLength, contentType: output.ContentType };
}

/** Delete a stored media reference. New S3 refs/keys go to the bucket; legacy
 *  Cloudinary publicIds keep using the existing destroy path. */
export async function deleteMediaRef(ref?: string | null, resourceType?: string): Promise<void> {
  if (!ref) return;
  if (isS3Ref(ref)) {
    if (isS3Configured()) await deleteObject(s3KeyOf(ref));
    return;
  }
  if (isS3Key(ref)) {
    if (isS3Configured()) await deleteObject(ref);
    return;
  }
  await destroyAsset(ref, resourceType);
}