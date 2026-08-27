import {
  AdminFrequentBookerSummary,
  AdminRecentReportSummary,
  AdminReportCategorySummary,
  AdminReportExportType,
  AdminReportsSnapshot,
  ReportPaymentAttemptRecord,
  ReportReservationRecord,
} from "../models/reports";
import { ReportsRepository } from "./reportsRepository";

const REPORT_CATEGORY_DEFINITIONS: Array<{
  id: AdminReportCategorySummary["id"];
  name: string;
  exportType: AdminReportExportType;
}> = [
  { id: "workspace", name: "Workspace Utilization", exportType: "workspace" },
  { id: "reservations", name: "Reservation History", exportType: "reservations" },
  { id: "payment", name: "Payment Records", exportType: "payment" },
  { id: "booking-activity", name: "Customer Booking Activity", exportType: "booking-activity" },
  { id: "cancellation", name: "Cancellation & Rescheduling", exportType: "cancellation" },
  { id: "checkin", name: "Check-in / Checkout Records", exportType: "checkin" },
];

export class ReportsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReportsError";
  }
}

export class ReportsService {
  constructor(
    private readonly repository: ReportsRepository,
    private readonly nowProvider: () => Date = () => new Date()
  ) {}

  async getAdminReportsSnapshot(): Promise<AdminReportsSnapshot> {
    const now = this.nowProvider();
    const reservations = await this.repository.listReportReservations();
    const payments = await this.repository.listReportPaymentAttempts();

    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    const reservationsThisMonth = reservations.filter((reservation) =>
      isWithinRange(reservation.createdAt, monthStart, nextMonthStart)
    );
    const approvedPaymentsThisMonth = payments.filter(
      (attempt) =>
        attempt.paymentStatus === "APPROVED" &&
        attempt.processedAt !== null &&
        isWithinRange(attempt.processedAt, monthStart, nextMonthStart)
    );

    const summaryMetrics = [
      {
        label: "Total Reservations This Month",
        value: formatInteger(reservationsThisMonth.length),
        rawValue: reservationsThisMonth.length,
      },
      {
        label: "Total Payments This Month",
        value: formatCurrency(
          approvedPaymentsThisMonth.reduce((sum, attempt) => sum + attempt.amount, 0),
          approvedPaymentsThisMonth[0]?.currency ?? "PHP"
        ),
        rawValue: approvedPaymentsThisMonth.reduce((sum, attempt) => sum + attempt.amount, 0),
      },
    ];

    const reportCategories = REPORT_CATEGORY_DEFINITIONS.map((definition) => ({
      id: definition.id,
      name: definition.name,
      count: this.buildExportRows(definition.exportType, reservations, payments).length,
      exportType: definition.exportType,
    }));

    const recentReports = REPORT_CATEGORY_DEFINITIONS.map((definition, index) =>
      this.buildRecentReport(definition.exportType, definition.name, index + 1, now)
    );

    const topUsers = buildTopUsers(reservationsThisMonth);

    return {
      summaryMetrics,
      reportCategories,
      recentReports,
      topUsers,
      defaultExportType: "operations-summary",
      generatedAt: now.toISOString(),
    };
  }

  async exportAdminReport(exportType: AdminReportExportType): Promise<{
    filename: string;
    contentType: string;
    content: string;
  }> {
    const now = this.nowProvider();
    const reservations = await this.repository.listReportReservations();
    const payments = await this.repository.listReportPaymentAttempts();
    const rows = this.buildExportRows(exportType, reservations, payments);
    const filenameDate = now.toISOString().slice(0, 10);

    return {
      filename: `deskatlas-${exportType}-${filenameDate}.csv`,
      contentType: "text/csv; charset=utf-8",
      content: toCsv(rows),
    };
  }

  private buildExportRows(
    exportType: AdminReportExportType,
    reservations: ReportReservationRecord[],
    payments: ReportPaymentAttemptRecord[]
  ): Array<Record<string, string | number>> {
    switch (exportType) {
      case "operations-summary":
        return buildOperationsSummaryRows(reservations, payments);
      case "workspace":
        return buildWorkspaceRows(reservations);
      case "reservations":
        return buildReservationRows(reservations);
      case "payment":
        return buildPaymentRows(payments);
      case "booking-activity":
        return buildBookingActivityRows(reservations);
      case "cancellation":
        return buildCancellationRows(reservations, payments);
      case "checkin":
        return buildCheckInRows(reservations);
      default:
        throw new ReportsError("Unsupported report export type.");
    }
  }

  private buildRecentReport(
    exportType: AdminReportExportType,
    name: string,
    sequence: number,
    now: Date
  ): AdminRecentReportSummary {
    const reportId = `RPT-${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(sequence).padStart(3, "0")}`;
    return {
      id: reportId,
      name: `${name} - ${formatMonthLabel(now)}`,
      date: now.toISOString().slice(0, 10),
      type: name,
      status: "ready",
      exportType,
    };
  }
}

export function createReportsService(
  repository: ReportsRepository,
  nowProvider?: () => Date
) {
  return new ReportsService(repository, nowProvider);
}

function buildTopUsers(
  reservations: ReportReservationRecord[]
): AdminFrequentBookerSummary[] {
  const byCustomer = new Map<
    string,
    { name: string; bookings: number; spent: number; currency: string }
  >();

  for (const reservation of reservations) {
    const key = reservation.customerEmail.trim().toLowerCase();
    const current = byCustomer.get(key) ?? {
      name: `${reservation.customerFirstName} ${reservation.customerLastName}`.trim(),
      bookings: 0,
      spent: 0,
      currency: reservation.currency,
    };

    current.bookings += 1;
    current.spent += reservation.amountDue;
    byCustomer.set(key, current);
  }

  return Array.from(byCustomer.values())
    .sort((left, right) => {
      if (right.bookings !== left.bookings) {
        return right.bookings - left.bookings;
      }
      return right.spent - left.spent;
    })
    .slice(0, 5)
    .map((entry) => ({
      name: entry.name,
      bookings: entry.bookings,
      spent: formatCurrency(entry.spent, entry.currency),
      rawSpent: entry.spent,
    }));
}

function buildOperationsSummaryRows(
  reservations: ReportReservationRecord[],
  payments: ReportPaymentAttemptRecord[]
) {
  const approvedPayments = payments.filter((attempt) => attempt.paymentStatus === "APPROVED");
  const totalApprovedAmount = approvedPayments.reduce((sum, attempt) => sum + attempt.amount, 0);
  const currency = approvedPayments[0]?.currency ?? reservations[0]?.currency ?? "PHP";

  return [
    { metric: "total_reservations", value: reservations.length },
    {
      metric: "confirmed_or_completed_reservations",
      value: reservations.filter((reservation) =>
        ["CONFIRMED", "CHECKED_IN", "COMPLETED"].includes(reservation.reservationStatus)
      ).length,
    },
    { metric: "payment_attempts", value: payments.length },
    { metric: "approved_payment_total", value: formatCurrency(totalApprovedAmount, currency) },
    {
      metric: "manual_resolution_cases",
      value: reservations.filter(
        (reservation) => reservation.reservationStatus === "NEEDS_MANUAL_RESOLUTION"
      ).length,
    },
    {
      metric: "cancelled_reservations",
      value: reservations.filter((reservation) => reservation.reservationStatus === "CANCELLED").length,
    },
  ];
}

function buildWorkspaceRows(reservations: ReportReservationRecord[]) {
  const usageByWorkspace = new Map<
    string,
    {
      floorName: string;
      workspaceDisplayName: string;
      workspaceInstanceCode: string;
      workspaceTemplateName: string;
      reservationCount: number;
      bookedHours: number;
    }
  >();

  for (const reservation of reservations) {
    if (!reservation.workspaceDisplayName || !reservation.bookingStartAt || !reservation.bookingEndAt) {
      continue;
    }

    const key = reservation.workspaceInstanceCode ?? reservation.workspaceDisplayName;
    const existing = usageByWorkspace.get(key) ?? {
      floorName: reservation.floorName ?? "",
      workspaceDisplayName: reservation.workspaceDisplayName,
      workspaceInstanceCode: reservation.workspaceInstanceCode ?? "",
      workspaceTemplateName: reservation.workspaceTemplateName ?? "",
      reservationCount: 0,
      bookedHours: 0,
    };

    existing.reservationCount += 1;
    existing.bookedHours += calculateDurationHours(
      reservation.bookingStartAt,
      reservation.bookingEndAt
    );
    usageByWorkspace.set(key, existing);
  }

  return Array.from(usageByWorkspace.values())
    .sort((left, right) => right.reservationCount - left.reservationCount)
    .map((entry) => ({
      floor_name: entry.floorName,
      workspace_name: entry.workspaceDisplayName,
      workspace_code: entry.workspaceInstanceCode,
      workspace_template: entry.workspaceTemplateName,
      reservation_count: entry.reservationCount,
      booked_hours: Number(entry.bookedHours.toFixed(2)),
    }));
}

function buildReservationRows(reservations: ReportReservationRecord[]) {
  return reservations
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map((reservation) => ({
      reference_code: reservation.referenceCode,
      source: reservation.source,
      customer_name: `${reservation.customerFirstName} ${reservation.customerLastName}`.trim(),
      customer_email: reservation.customerEmail,
      reservation_status: reservation.reservationStatus,
      workspace_name: reservation.workspaceDisplayName ?? "",
      workspace_code: reservation.workspaceInstanceCode ?? "",
      floor_name: reservation.floorName ?? "",
      booking_start_at: reservation.bookingStartAt ?? "",
      booking_end_at: reservation.bookingEndAt ?? "",
      amount_due: reservation.amountDue,
      currency: reservation.currency,
      created_at: reservation.createdAt,
    }));
}

function buildPaymentRows(payments: ReportPaymentAttemptRecord[]) {
  return payments
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map((attempt) => ({
      reservation_reference_code: attempt.reservationReferenceCode,
      channel: attempt.channel,
      payment_status: attempt.paymentStatus,
      refund_status: attempt.refundStatus,
      payment_method: attempt.paymentMethodDisplayName ?? "",
      payment_method_type: attempt.paymentMethodType ?? "",
      amount: attempt.amount,
      currency: attempt.currency,
      proof_submitted_at: attempt.proofSubmittedAt ?? "",
      processed_at: attempt.processedAt ?? "",
      created_at: attempt.createdAt,
    }));
}

function buildBookingActivityRows(reservations: ReportReservationRecord[]) {
  return reservations
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map((reservation) => ({
      customer_name: `${reservation.customerFirstName} ${reservation.customerLastName}`.trim(),
      customer_email: reservation.customerEmail,
      reference_code: reservation.referenceCode,
      source: reservation.source,
      reservation_status: reservation.reservationStatus,
      assigned_candidate_rank:
        reservation.assignedCandidateRank === null ? "" : reservation.assignedCandidateRank,
      amount_due: reservation.amountDue,
      created_at: reservation.createdAt,
    }));
}

function buildCancellationRows(
  reservations: ReportReservationRecord[],
  payments: ReportPaymentAttemptRecord[]
) {
  const refundStatusByReservation = new Map<string, string>();
  for (const payment of payments) {
    const existing = refundStatusByReservation.get(payment.reservationId);
    if (existing === "REFUNDED") {
      continue;
    }
    refundStatusByReservation.set(payment.reservationId, payment.refundStatus);
  }

  return reservations
    .filter((reservation) =>
      reservation.reservationStatus === "CANCELLED" ||
      reservation.reservationStatus === "NEEDS_MANUAL_RESOLUTION"
    )
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map((reservation) => ({
      reference_code: reservation.referenceCode,
      customer_name: `${reservation.customerFirstName} ${reservation.customerLastName}`.trim(),
      reservation_status: reservation.reservationStatus,
      refund_status: refundStatusByReservation.get(reservation.reservationId) ?? "NONE",
      amount_due: reservation.amountDue,
      currency: reservation.currency,
      created_at: reservation.createdAt,
    }));
}

function buildCheckInRows(reservations: ReportReservationRecord[]) {
  return reservations
    .filter((reservation) => reservation.checkedInAt !== null || reservation.checkedOutAt !== null)
    .sort((left, right) =>
      (right.checkedInAt ?? right.checkedOutAt ?? "").localeCompare(
        left.checkedInAt ?? left.checkedOutAt ?? ""
      )
    )
    .map((reservation) => ({
      reference_code: reservation.referenceCode,
      customer_name: `${reservation.customerFirstName} ${reservation.customerLastName}`.trim(),
      workspace_name: reservation.workspaceDisplayName ?? "",
      workspace_code: reservation.workspaceInstanceCode ?? "",
      floor_name: reservation.floorName ?? "",
      checked_in_at: reservation.checkedInAt ?? "",
      checked_out_at: reservation.checkedOutAt ?? "",
      reservation_status: reservation.reservationStatus,
      source: reservation.source,
    }));
}

function isWithinRange(valueIso: string, start: Date, end: Date) {
  const valueTime = new Date(valueIso).getTime();
  return valueTime >= start.getTime() && valueTime < end.getTime();
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function formatCurrency(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function formatMonthLabel(now: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(now);
}

function calculateDurationHours(startAt: string, endAt: string) {
  return (new Date(endAt).getTime() - new Date(startAt).getTime()) / (1000 * 60 * 60);
}

function toCsv(rows: Array<Record<string, string | number>>) {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => csvEscape(row[header]))
        .join(",")
    ),
  ];

  return lines.join("\n");
}

function csvEscape(value: string | number) {
  const stringValue = String(value ?? "");
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}
