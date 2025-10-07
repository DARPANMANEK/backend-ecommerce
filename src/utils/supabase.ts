import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";

export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false },
  }
);

export function getPublicUrl(path: string): string {
  const base = env.SUPABASE_PUBLIC_URL || env.SUPABASE_URL;
  return `${base}/storage/v1/object/public/${env.SUPABASE_BUCKET}/${path}`;
}

export async function uploadImage(
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string> {
  const normalizedName = fileName.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const objectPath = `${Date.now()}-${normalizedName}`;
  const { error } = await supabase.storage
    .from(env.SUPABASE_BUCKET!)
    .upload(objectPath, fileBuffer, {
      contentType: mimeType,
      upsert: false,
    });
  if (error) throw error;
  return getPublicUrl(objectPath);
}

export async function createSignedUploadUrl(
  fileName: string,
  _contentType: string
): Promise<{
  signedUrl: string;
  token: string;
  objectPath: string;
  publicUrl: string;
}> {
  const normalizedName = fileName.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const objectPath = `${Date.now()}-${normalizedName}`;
  const { data, error } = await supabase.storage
    .from(env.SUPABASE_BUCKET!)
    .createSignedUploadUrl(objectPath);
  if (error || !data)
    throw error ?? new Error("Failed to create signed upload URL");
  const publicUrl = getPublicUrl(objectPath);
  return {
    signedUrl: (data as any).signedUrl,
    token: (data as any).token,
    objectPath,
    publicUrl,
  };
}
