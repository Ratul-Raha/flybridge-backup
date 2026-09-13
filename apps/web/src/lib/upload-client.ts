export type UploadScope = "courses" | "resources" | "stories" | "scholarships" | "blogs" | "mock-tests";

export type StoredUpload = {
  /** What callers persist in URL fields — full public URL for images,
   *  `s3://<bucket>/<key>` for private files (lesson videos, PDFs, resources). */
  ref: string;
  /** S3 object key — stored in `publicId`-style fields so deletes find the object. */
  key: string;
  visibility: "public" | "private";
};

type PresignResult = StoredUpload & { uploadUrl: string; contentType: string };

async function presignUpload(file: File, scope: UploadScope, use: "file" | "thumbnail"): Promise<PresignResult> {
  const res = await fetch("/api/uploads/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scope,
      use,
      name: file.name,
      size: file.size,
      contentType: file.type,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Upload failed");
  return {
    uploadUrl: data.uploadUrl as string,
    contentType: data.contentType as string,
    ref: data.ref as string,
    key: data.key as string,
    visibility: data.visibility as "public" | "private",
  };
}

function putToS3(uploadUrl: string, file: File, contentType: string, onProgress?: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (HTTP ${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(file);
  });
}

/** Browser → S3 direct upload via a short-lived presigned PUT. The file never
 *  passes through the server, so Vercel function body limits don't apply. */
export async function uploadToStorage(
  file: File,
  scope: UploadScope,
  use: "file" | "thumbnail" = "file",
  onProgress?: (pct: number) => void
): Promise<StoredUpload> {
  const target = await presignUpload(file, scope, use);
  await putToS3(target.uploadUrl, file, target.contentType, onProgress);
  return { ref: target.ref, key: target.key, visibility: target.visibility };
}