import { FitNote } from "@/types/database";

/**
 * Fetch all fit notes for a sickness case.
 */
export async function fetchFitNotes(caseId: string): Promise<{ fitNotes: FitNote[] }> {
  const res = await fetch(`/api/sickness-cases/${caseId}/fit-notes`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch fit notes");
  }

  return res.json();
}

/**
 * Upload a fit note document with metadata.
 * Sends as FormData (multipart), not JSON.
 */
export async function fetchUploadFitNote(caseId: string, formData: FormData): Promise<{ fitNote: FitNote }> {
  const res = await fetch(`/api/sickness-cases/${caseId}/fit-notes`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to upload fit note");
  }

  return res.json();
}

/**
 * Get a signed download URL for a fit note document.
 * URL expires after 5 minutes.
 */
export async function fetchFitNoteDownloadUrl(
  caseId: string,
  fitNoteId: string,
): Promise<{ signedUrl: string }> {
  const res = await fetch(`/api/sickness-cases/${caseId}/fit-notes/${fitNoteId}/download`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to get download URL");
  }

  return res.json();
}
