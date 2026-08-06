import { v2 as cloudinary } from "cloudinary";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME ?? "";
const API_KEY = process.env.CLOUDINARY_API_KEY ?? "";
const API_SECRET = process.env.CLOUDINARY_API_SECRET ?? "";

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
  secure: true,
});

export function isCloudinaryConfigured() {
  return Boolean(CLOUD_NAME && API_KEY && API_SECRET);
}

export type UploadedAsset = {
  url: string;
  publicId: string;
  resourceType: "image" | "video" | "raw";
  format: string;
  bytes: number;
};

const UPLOAD_FOLDER = process.env.CLOUDINARY_FOLDER?.replace(/\/+$/, "") || "flybridge";

function slugify(name: string) {
  const base = name.replace(/\.[^.]+$/, "").toLowerCase();
  const slug = base
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${slug || "file"}-${rand}`;
}

export function uploadAsset(
  file: File,
  folder = "flybridge/resources",
  resourceType: "image" | "video" | "raw" | "auto" = "auto"
): Promise<UploadedAsset> {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured()) {
      reject(new Error("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET."));
      return;
    }

    file
      .arrayBuffer()
      .then((buffer) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder,
              public_id: slugify(file.name),
              resource_type: resourceType,
              use_filename_as_display_name: true,
              overwrite: false,
            },
            (error, result) => {
              if (error || !result) {
                reject(error ?? new Error("Upload to Cloudinary failed"));
                return;
              }
              resolve({
                url: result.secure_url,
                publicId: result.public_id,
                resourceType: result.resource_type as UploadedAsset["resourceType"],
                format: result.format ?? "",
                bytes: result.bytes ?? 0,
              });
            }
          )
          .end(Buffer.from(buffer));
      })
      .catch(reject);
  });
}

export async function destroyAsset(publicId: string, resourceType?: string) {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType === "video" ? "video" : resourceType === "image" ? "image" : "raw",
      invalidate: true,
    });
  } catch (error) {
    console.error("Cloudinary destroy failed", publicId, error);
  }
}

export { CLOUD_NAME, UPLOAD_FOLDER };
