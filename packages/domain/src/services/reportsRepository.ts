import {
  ReportPaymentAttemptRecord,
  ReportReservationRecord,
} from "../models/reports";

export interface ReportsRepository {
  listReportReservations(): Promise<ReportReservationRecord[]>;
  listReportPaymentAttempts(): Promise<ReportPaymentAttemptRecord[]>;
}
