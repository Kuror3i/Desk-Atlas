import type {
  AdminReportExportType,
  AdminReportRange,
  AdminReportsSnapshot,
} from "@deskatlas/domain";

export async function fetchAdminReportsSnapshot(range: AdminReportRange = "30days"): Promise<AdminReportsSnapshot> {
  const response = await fetch(`/api/admin/reports?range=${encodeURIComponent(range)}`, { cache: "no-store" });
  return parseJson(response);
}

export async function downloadAdminReport(
  exportType: AdminReportExportType,
  range?: AdminReportRange
): Promise<void> {
  const url = range
    ? `/api/admin/reports/export?type=${encodeURIComponent(exportType)}&range=${encodeURIComponent(range)}`
    : `/api/admin/reports/export?type=${encodeURIComponent(exportType)}`;

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Report download failed with status ${response.status}`);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition");
  const filename =
    disposition?.match(/filename="([^"]+)"/)?.[1] ??
    `deskatlas-${exportType}.csv`;

  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(downloadUrl);
}

async function parseJson(response: Response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error ?? `Reports API request failed with status ${response.status}`);
  }
  return body;
}
