import type {
  AdminReportExportType,
  AdminReportsSnapshot,
} from "@deskatlas/domain";

export async function fetchAdminReportsSnapshot(): Promise<AdminReportsSnapshot> {
  const response = await fetch("/api/admin/reports", { cache: "no-store" });
  return parseJson(response);
}

export async function downloadAdminReport(exportType: AdminReportExportType): Promise<void> {
  const response = await fetch(
    `/api/admin/reports/export?type=${encodeURIComponent(exportType)}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Report download failed with status ${response.status}`);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition");
  const filename =
    disposition?.match(/filename="([^"]+)"/)?.[1] ??
    `deskatlas-${exportType}.csv`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function parseJson(response: Response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error ?? `Reports API request failed with status ${response.status}`);
  }
  return body;
}
