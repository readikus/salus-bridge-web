import { createServerClient } from "@/providers/supabase/client";

const BUCKET_NAME = "fit-notes";
const SIGNED_URL_EXPIRY_SECONDS = 300;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

const ALLOWED_CONTENT_TYPES = ["application/pdf", "image/jpeg", "image/png"];

/**
 * StorageService wraps Supabase Storage for secure document upload/download.
 * Files are stored in a private bucket with signed URL access.
 */
export class StorageService {
  /**
   * Upload a file to the private fit-notes bucket.
   * Validates content type (PDF/image) and file size (<= 10MB).
   *
   * @returns The storage path string for later retrieval
   */
  static async upload(
    organisationId: string,
    caseId: string,
    fileName: string,
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<string> {
    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      throw new Error(`Invalid content type: ${contentType}. Allowed: ${ALLOWED_CONTENT_TYPES.join(", ")}`);
    }

    if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File size exceeds maximum of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`);
    }

    const storagePath = `${organisationId}/${caseId}/${Date.now()}-${fileName}`;

    const supabase = await createServerClient();
    const { error } = await supabase.storage.from(BUCKET_NAME).upload(storagePath, fileBuffer, {
      contentType,
      upsert: false,
    });

    if (error) {
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    return storagePath;
  }

  /**
   * Generate a short-lived signed URL for downloading a file.
   * URL expires after 5 minutes (300 seconds).
   */
  static async getSignedUrl(storagePath: string): Promise<string> {
    const supabase = await createServerClient();
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, SIGNED_URL_EXPIRY_SECONDS);

    if (error || !data?.signedUrl) {
      throw new Error(`Failed to generate signed URL: ${error?.message || "No URL returned"}`);
    }

    return data.signedUrl;
  }

  /**
   * Delete a file from storage. Used for cleanup.
   */
  static async delete(storagePath: string): Promise<void> {
    const supabase = await createServerClient();
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([storagePath]);

    if (error) {
      throw new Error(`Storage delete failed: ${error.message}`);
    }
  }
}
