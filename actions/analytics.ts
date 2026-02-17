import { AnalyticsResult } from "@/providers/services/analytics.service";

interface AnalyticsQueryParams {
  period?: string;
  departmentId?: string;
  groupBy?: string;
}

/**
 * Fetch analytics data for an organisation.
 */
export async function fetchAnalytics(slug: string, params?: AnalyticsQueryParams): Promise<AnalyticsResult> {
  const searchParams = new URLSearchParams();
  if (params?.period) searchParams.set("period", params.period);
  if (params?.departmentId) searchParams.set("departmentId", params.departmentId);
  if (params?.groupBy) searchParams.set("groupBy", params.groupBy);

  const query = searchParams.toString();
  const url = `/api/organisations/${slug}/analytics${query ? `?${query}` : ""}`;

  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch analytics");
  }
  return res.json();
}

/**
 * Export analytics as CSV. Triggers a browser download.
 */
export async function exportAnalyticsCSV(slug: string, params?: AnalyticsQueryParams): Promise<void> {
  const searchParams = new URLSearchParams();
  searchParams.set("format", "csv");
  if (params?.period) searchParams.set("period", params.period);
  if (params?.departmentId) searchParams.set("departmentId", params.departmentId);
  if (params?.groupBy) searchParams.set("groupBy", params.groupBy);

  const url = `/api/organisations/${slug}/analytics/export?${searchParams.toString()}`;
  const res = await fetch(url);

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to export analytics CSV");
  }

  // Trigger browser download
  const blob = await res.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = `analytics-${slug}-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}

/**
 * Export analytics as PDF (print-ready HTML). Opens in new window for printing.
 */
export async function exportAnalyticsPDF(slug: string, params?: AnalyticsQueryParams): Promise<void> {
  const searchParams = new URLSearchParams();
  searchParams.set("format", "pdf");
  if (params?.period) searchParams.set("period", params.period);
  if (params?.departmentId) searchParams.set("departmentId", params.departmentId);
  if (params?.groupBy) searchParams.set("groupBy", params.groupBy);

  const url = `/api/organisations/${slug}/analytics/export?${searchParams.toString()}`;
  const res = await fetch(url);

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to export analytics PDF");
  }

  const html = await res.text();
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }
}
