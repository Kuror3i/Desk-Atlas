import {
  BookingAccessState,
  CounterPaymentRecord,
  CreateReservationRequest,
  OperationalActivityRecord,
  OccupancyRecord,
  PaymentMethod,
  PaymentProofSubmissionResult,
  PaymentReviewDecisionResult,
  PaymentReviewDetail,
  PaymentReviewQueueItem,
  PaymentSessionRecord,
  ReservationOperationalActionResult,
  ReservationCandidate,
  ReservationResponseDTO,
  StaffOperationalReservation,
} from "../models/reservation";
import {
  ReportPaymentAttemptRecord,
  ReportReservationRecord,
} from "../models/reports";
import { ReservationRepository } from "./reservationRepository";
import { BookingAccessRecord, BookingAccessRepository } from "./bookingAccessRepository";
import { CounterPaymentRepository } from "./counterPaymentRepository";
import { CreateWebPaymentSessionInput, ReservationPaymentRepository } from "./paymentSessionRepository";
import { PaymentReviewRepository } from "./paymentReviewRepository";
import { ReportsRepository } from "./reportsRepository";
import { StaffOperationsRepository } from "./staffOperationsRepository";
import {
  GuestReservationTrackingRecord,
  GuestReservationTrackingRepository,
} from "./guestReservationTrackingRepository";

export class ReservationSupabaseRepository
  implements
    ReservationRepository,
    ReservationPaymentRepository,
    PaymentReviewRepository,
    BookingAccessRepository,
    CounterPaymentRepository,
    StaffOperationsRepository,
    GuestReservationTrackingRepository,
    ReportsRepository
{
  private readonly restUrl: string;
  private readonly serviceRoleKey: string;

  constructor(options?: { supabaseUrl?: string; serviceRoleKey?: string }) {
    const supabaseUrl =
      options?.supabaseUrl ?? process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = options?.serviceRoleKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is required for reservation routes');
    }

    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for reservation routes');
    }

    this.restUrl = `${supabaseUrl.replace(/\/$/, '')}/rest/v1`;
    this.serviceRoleKey = serviceRoleKey;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers);
    headers.set('apikey', this.serviceRoleKey);
    headers.set('Authorization', `Bearer ${this.serviceRoleKey}`);
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${this.restUrl}${path}`, {
      ...options,
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Supabase request failed (${response.status}): ${detail}`);
    }

    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  private mapReservation(data: any, candidates: ReservationCandidate[]): ReservationResponseDTO {
    return {
      id: data.id,
      referenceCode: data.reference_code,
      source: data.source,
      customerFirstName: data.customer_first_name,
      customerLastName: data.customer_last_name,
      customerEmail: data.customer_email,
      status: data.status,
      rateSnapshot: Number(data.rate_snapshot),
      amountDue: Number(data.amount_due),
      currency: data.currency,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      confirmedAt: data.confirmed_at,
      bookingTokenHash: data.booking_token_hash,
      qrIssuedAt: data.qr_issued_at,
      qrRevokedAt: data.qr_revoked_at,
      checkedInAt: data.checked_in_at,
      checkedOutAt: data.checked_out_at,
      candidates,
    };
  }

  async createReservation(
    request: CreateReservationRequest,
    rateSnapshot: number,
    amountDue: number,
    paymentSession?: CreateWebPaymentSessionInput
  ): Promise<ReservationResponseDTO> {
    let reservationId: string;
    let counterPaymentAttemptId: string | undefined;

    if (request.source === "WEB" && paymentSession) {
      const paymentResult = await this.request<any[]>("/rpc/create_web_reservation_with_payment_session", {
        method: "POST",
        body: JSON.stringify({
          p_first_name: request.customerFirstName,
          p_last_name: request.customerLastName,
          p_email: request.customerEmail,
          p_rate_snapshot: rateSnapshot,
          p_amount_due: amountDue,
          p_candidates: request.candidates,
          p_token_hash: paymentSession.tokenHash,
          p_expires_at: paymentSession.expiresAt,
        }),
      });

      if (!paymentResult || paymentResult.length === 0) {
        throw new Error("Failed to create reservation payment session.");
      }

      reservationId = paymentResult[0].reservation_id;
    } else if (request.source === "KIOSK") {
      const paymentResult = await this.request<any[]>(
        "/rpc/create_kiosk_reservation_with_counter_payment",
        {
          method: "POST",
          body: JSON.stringify({
            p_first_name: request.customerFirstName,
            p_last_name: request.customerLastName,
            p_email: request.customerEmail,
            p_rate_snapshot: rateSnapshot,
            p_amount_due: amountDue,
            p_candidates: request.candidates,
            p_payment_method_id: request.paymentMethodId,
          }),
        }
      );

      if (!paymentResult || paymentResult.length === 0) {
        throw new Error("Failed to create kiosk counter payment.");
      }

      reservationId = paymentResult[0].reservation_id;
      counterPaymentAttemptId = paymentResult[0].payment_attempt_id;
    } else {
      const data = await this.request<any>("/rpc/create_reservation", {
        method: "POST",
        body: JSON.stringify({
          p_source: request.source,
          p_first_name: request.customerFirstName,
          p_last_name: request.customerLastName,
          p_email: request.customerEmail,
          p_rate_snapshot: rateSnapshot,
          p_amount_due: amountDue,
          p_candidates: request.candidates,
        }),
      });

      if (!data) {
        throw new Error("Failed to create reservation: no data returned from RPC.");
      }

      reservationId = data.id;
    }

    const candidatesData = await this.request<any[]>(
      `/reservation_candidates?select=*&reservation_id=eq.${encodeURIComponent(reservationId)}&order=rank.asc`
    );

    const candidates: ReservationCandidate[] = candidatesData.map((c: any) => ({
      id: c.id,
      reservationId: c.reservation_id,
      rank: c.rank,
      workspaceInstanceId: c.workspace_instance_id,
      startAt: c.start_at,
      endAt: c.end_at,
      isAssigned: c.is_assigned,
    }));

    const reservationRows = await this.request<any[]>(
      `/reservations?select=*&id=eq.${encodeURIComponent(reservationId)}&limit=1`
    );

    if (!reservationRows || reservationRows.length === 0) {
      throw new Error("Created reservation could not be loaded.");
    }

    return {
      ...this.mapReservation(reservationRows[0], candidates),
      counterPaymentAttemptId,
    };
  }

  async getPaymentExpiryMinutes(): Promise<number> {
    const settingsRows = await this.request<any[]>(
      "/business_settings?select=payment_expiry_minutes&id=eq.1&limit=1"
    );

    return Number(settingsRows?.[0]?.payment_expiry_minutes ?? 60);
  }

  async listActiveWebPaymentMethods(): Promise<PaymentMethod[]> {
    const rows = await this.request<any[]>(
      "/payment_methods?select=*&is_active=eq.true&allow_web=eq.true&order=display_order.asc"
    );

    return rows.map((row) => ({
      id: row.id,
      methodType: row.method_type,
      displayName: row.display_name,
      accountName: row.account_name,
      accountNumber: row.account_number,
      instructions: row.instructions,
      qrImagePath: row.qr_image_path,
      allowWeb: row.allow_web,
      allowKiosk: row.allow_kiosk,
      isActive: row.is_active,
      displayOrder: row.display_order,
    }));
  }

  async listActiveKioskPaymentMethods(): Promise<PaymentMethod[]> {
    const rows = await this.request<any[]>(
      "/payment_methods?select=*&is_active=eq.true&allow_kiosk=eq.true&order=display_order.asc"
    );

    return rows.map((row) => ({
      id: row.id,
      methodType: row.method_type,
      displayName: row.display_name,
      accountName: row.account_name,
      accountNumber: row.account_number,
      instructions: row.instructions,
      qrImagePath: row.qr_image_path,
      allowWeb: row.allow_web,
      allowKiosk: row.allow_kiosk,
      isActive: row.is_active,
      displayOrder: row.display_order,
    }));
  }

  async getCounterPaymentRecord(paymentAttemptId: string): Promise<CounterPaymentRecord | null> {
    const attempt = (
      await this.request<any[]>(
        `/payment_attempts?select=*&id=eq.${encodeURIComponent(paymentAttemptId)}&channel=eq.KIOSK&limit=1`
      )
    )?.[0];

    if (!attempt) {
      return null;
    }

    const reservation = (
      await this.request<any[]>(
        `/reservations?select=*&id=eq.${encodeURIComponent(attempt.reservation_id)}&limit=1`
      )
    )?.[0];

    if (!reservation) {
      return null;
    }

    const candidatesRows = await this.request<any[]>(
      `/reservation_candidates?select=*&reservation_id=eq.${encodeURIComponent(reservation.id)}&order=rank.asc`
    );

    const candidates: ReservationCandidate[] = candidatesRows.map((candidate: any) => ({
      id: candidate.id,
      reservationId: candidate.reservation_id,
      rank: candidate.rank,
      workspaceInstanceId: candidate.workspace_instance_id,
      startAt: candidate.start_at,
      endAt: candidate.end_at,
      isAssigned: candidate.is_assigned,
    }));

    return {
      paymentAttemptId: attempt.id,
      reservationId: reservation.id,
      reservationReferenceCode: reservation.reference_code,
      reservationStatus: reservation.status,
      paymentStatus: attempt.status,
      customerEmail: reservation.customer_email,
      customerFirstName: reservation.customer_first_name,
      customerLastName: reservation.customer_last_name,
      amountDue: Number(reservation.amount_due),
      currency: reservation.currency,
      paymentMethodId: attempt.payment_method_id,
      submittedCandidates: candidates,
      processedAt: attempt.processed_at,
      processedByUserId: attempt.processed_by_user_id,
    };
  }

  async findPaymentSessionByTokenHash(tokenHash: string): Promise<PaymentSessionRecord | null> {
    const attemptRows = await this.request<any[]>(
      `/payment_attempts?select=*&token_hash=eq.${encodeURIComponent(tokenHash)}&channel=eq.WEB&limit=1`
    );

    if (!attemptRows || attemptRows.length === 0) {
      return null;
    }

    const attempt = attemptRows[0];
    const reservationRows = await this.request<any[]>(
      `/reservations?select=*&id=eq.${encodeURIComponent(attempt.reservation_id)}&limit=1`
    );

    if (!reservationRows || reservationRows.length === 0) {
      return null;
    }

    const reservation = reservationRows[0];

    return {
      paymentAttemptId: attempt.id,
      reservationId: reservation.id,
      reservationReferenceCode: reservation.reference_code,
      reservationStatus: reservation.status,
      paymentStatus: attempt.status,
      customerEmail: reservation.customer_email,
      customerFirstName: reservation.customer_first_name,
      customerLastName: reservation.customer_last_name,
      amountDue: Number(reservation.amount_due),
      currency: reservation.currency,
      expiresAt: attempt.expires_at,
      proofSubmittedAt: attempt.proof_submitted_at,
      paymentMethodId: attempt.payment_method_id,
    };
  }

  async expirePaymentSession(tokenHash: string, expiredAt: string): Promise<boolean> {
    const result = await this.request<any[]>("/rpc/expire_web_payment_session", {
      method: "POST",
      body: JSON.stringify({
        p_token_hash: tokenHash,
        p_expired_at: expiredAt,
      }),
    });

    return Array.isArray(result) && result.length > 0;
  }

  async submitPaymentProof(input: {
    tokenHash: string;
    paymentMethodId: string;
    proofStoragePath: string;
    proofSubmittedAt: string;
  }): Promise<PaymentProofSubmissionResult> {
    const result = await this.request<any[]>("/rpc/submit_web_payment_proof", {
      method: "POST",
      body: JSON.stringify({
        p_token_hash: input.tokenHash,
        p_payment_method_id: input.paymentMethodId,
        p_proof_storage_path: input.proofStoragePath,
        p_proof_submitted_at: input.proofSubmittedAt,
      }),
    });

    if (!Array.isArray(result) || result.length === 0) {
      throw new Error("Failed to submit payment proof.");
    }

    return {
      paymentAttemptId: result[0].payment_attempt_id,
      reservationId: result[0].reservation_id,
      reservationStatus: result[0].reservation_status,
      paymentStatus: result[0].payment_status,
      proofSubmittedAt: result[0].proof_submitted_at,
    };
  }

  async listPaymentReviewQueue(): Promise<PaymentReviewQueueItem[]> {
    const attempts = await this.request<any[]>(
      "/payment_attempts?select=*&channel=eq.WEB&status=eq.UNDER_REVIEW&order=proof_submitted_at.asc"
    );

    const reviews = await Promise.all(
      attempts.map(async (attempt) => this.loadPaymentReview(attempt.id, attempt))
    );

    return reviews
      .filter((review): review is PaymentReviewDetail => review !== null)
      .map(({ proofStoragePath: _proofStoragePath, rejectionReason: _rejectionReason, refundStatus: _refundStatus, processedAt: _processedAt, processedByUserId: _processedByUserId, ...queueItem }) => queueItem);
  }

  async getPaymentReviewDetail(paymentAttemptId: string): Promise<PaymentReviewDetail | null> {
    return this.loadPaymentReview(paymentAttemptId);
  }

  async approvePaymentAndAllocate(input: {
    paymentAttemptId: string;
    actorUserId: string;
    processedAt: string;
  }): Promise<PaymentReviewDecisionResult> {
    const result = await this.request<any[]>("/rpc/approve_online_payment_and_allocate", {
      method: "POST",
      body: JSON.stringify({
        p_payment_attempt_id: input.paymentAttemptId,
        p_processed_by_user_id: input.actorUserId,
        p_processed_at: input.processedAt,
      }),
    });

    if (!Array.isArray(result) || result.length === 0) {
      throw new Error("Failed to approve payment review.");
    }

    return this.mapDecisionResult(result[0]);
  }

  async rejectPaymentAttempt(input: {
    paymentAttemptId: string;
    actorUserId: string;
    processedAt: string;
    rejectionReason: string;
  }): Promise<PaymentReviewDecisionResult> {
    const result = await this.request<any[]>("/rpc/reject_online_payment_attempt", {
      method: "POST",
      body: JSON.stringify({
        p_payment_attempt_id: input.paymentAttemptId,
        p_processed_by_user_id: input.actorUserId,
        p_processed_at: input.processedAt,
        p_rejection_reason: input.rejectionReason,
      }),
    });

    if (!Array.isArray(result) || result.length === 0) {
      throw new Error("Failed to reject payment review.");
    }

    return this.mapDecisionResult(result[0]);
  }

  async confirmCounterPaymentAndAllocate(input: {
    paymentAttemptId: string;
    actorUserId: string;
    processedAt: string;
  }): Promise<PaymentReviewDecisionResult> {
    const result = await this.request<any[]>("/rpc/confirm_kiosk_payment_and_allocate", {
      method: "POST",
      body: JSON.stringify({
        p_payment_attempt_id: input.paymentAttemptId,
        p_processed_by_user_id: input.actorUserId,
        p_processed_at: input.processedAt,
      }),
    });

    if (!Array.isArray(result) || result.length === 0) {
      throw new Error("Failed to confirm counter payment.");
    }

    return this.mapDecisionResult(result[0]);
  }

  async issueBookingAccessToken(input: {
    reservationId: string;
    tokenHash: string;
    issuedAt: string;
  }): Promise<boolean> {
    const reservationRows = await this.request<any[]>(
      `/reservations?select=id,status,booking_token_hash&id=eq.${encodeURIComponent(input.reservationId)}&limit=1`
    );

    if (!reservationRows || reservationRows.length === 0) {
      throw new Error("Reservation was not found.");
    }

    const reservation = reservationRows[0];
    if (reservation.booking_token_hash) {
      return false;
    }

    if (reservation.status !== "CONFIRMED") {
      throw new Error("Booking access can only be issued for confirmed reservations.");
    }

    const response = await fetch(
      `${this.restUrl}/reservations?id=eq.${encodeURIComponent(input.reservationId)}&booking_token_hash=is.null&select=id`,
      {
        method: "PATCH",
        headers: {
          apikey: this.serviceRoleKey,
          Authorization: `Bearer ${this.serviceRoleKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        cache: "no-store",
        body: JSON.stringify({
          booking_token_hash: input.tokenHash,
          qr_issued_at: input.issuedAt,
          updated_at: input.issuedAt,
        }),
      }
    );

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Supabase request failed (${response.status}): ${detail}`);
    }

    const updatedRows = (await response.json()) as any[];
    return Array.isArray(updatedRows) && updatedRows.length > 0;
  }

  async findBookingAccessByTokenHash(tokenHash: string): Promise<BookingAccessRecord | null> {
    const reservationRows = await this.request<any[]>(
      `/reservations?select=*&booking_token_hash=eq.${encodeURIComponent(tokenHash)}&limit=1`
    );

    if (!reservationRows || reservationRows.length === 0) {
      return null;
    }

    const reservation = reservationRows[0];
    const assignedCandidate = (
      await this.request<any[]>(
        `/reservation_candidates?select=*&reservation_id=eq.${encodeURIComponent(reservation.id)}&is_assigned=eq.true&limit=1`
      )
    )?.[0];

    if (!assignedCandidate) {
      return null;
    }

    const workspaceInstance = (
      await this.request<any[]>(
        `/workspace_instances?select=*&id=eq.${encodeURIComponent(assignedCandidate.workspace_instance_id)}&limit=1`
      )
    )?.[0];
    const workspaceTemplate = workspaceInstance
      ? (
          await this.request<any[]>(
            `/workspace_templates?select=*&id=eq.${encodeURIComponent(workspaceInstance.template_id)}&limit=1`
          )
        )?.[0]
      : null;
    const floor = workspaceInstance
      ? (
          await this.request<any[]>(
            `/floors?select=*&id=eq.${encodeURIComponent(workspaceInstance.floor_id)}&limit=1`
          )
        )?.[0]
      : null;

    return {
      reservationId: reservation.id,
      referenceCode: reservation.reference_code,
      reservationStatus: reservation.status,
      customerFirstName: reservation.customer_first_name,
      customerLastName: reservation.customer_last_name,
      bookingTokenHash: reservation.booking_token_hash,
      qrIssuedAt: reservation.qr_issued_at,
      qrRevokedAt: reservation.qr_revoked_at,
      checkedInAt: reservation.checked_in_at,
      checkedOutAt: reservation.checked_out_at,
      assignedWorkspaceInstanceId: assignedCandidate.workspace_instance_id,
      assignedWorkspaceDisplayName:
        workspaceInstance?.display_name ?? workspaceInstance?.instance_code ?? assignedCandidate.workspace_instance_id,
      assignedWorkspaceInstanceCode:
        workspaceInstance?.instance_code ?? assignedCandidate.workspace_instance_id,
      assignedWorkspaceTemplateName: workspaceTemplate?.name ?? "Workspace",
      assignedFloorName: floor?.name ?? "Unknown Floor",
      assignedStartAt: assignedCandidate.start_at,
      assignedEndAt: assignedCandidate.end_at,
    };
  }

  async recordBookingScan(input: {
    reservationId: string;
    scannedAt: string;
    accessState: BookingAccessState;
  }): Promise<void> {
    const response = await fetch(`${this.restUrl}/audit_logs`, {
      method: "POST",
      headers: {
        apikey: this.serviceRoleKey,
        Authorization: `Bearer ${this.serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      cache: "no-store",
      body: JSON.stringify({
        actor_user_id: null,
        actor_role: "SYSTEM",
        action: "booking_qr_scanned",
        entity_type: "reservation",
        entity_id: input.reservationId,
        metadata: {
          access_state: input.accessState,
          scanned_at: input.scannedAt,
        },
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Supabase request failed (${response.status}): ${detail}`);
    }
  }

  async listOperationalReservations(_nowIso: string): Promise<StaffOperationalReservation[]> {
    const reservations = await this.request<any[]>(
      "/reservations?select=*&order=created_at.desc&limit=200"
    );

    const summaries = await Promise.all(
      reservations.map((reservation) => this.loadOperationalReservation(reservation.id, reservation))
    );

    return summaries
      .filter((summary): summary is StaffOperationalReservation => summary !== null)
      .sort(compareOperationalReservations);
  }

  async listOccupancy(nowIso: string): Promise<OccupancyRecord[]> {
    const reservations = await this.request<any[]>(
      "/reservations?select=*&status=in.(CONFIRMED,CHECKED_IN)&limit=200"
    );

    const summaries = await Promise.all(
      reservations.map((reservation) => this.loadOperationalReservation(reservation.id, reservation))
    );

    return summaries
      .filter((summary): summary is StaffOperationalReservation => summary !== null)
      .filter(
        (summary) =>
          summary.bookingStartAt !== null &&
          summary.bookingEndAt !== null &&
          summary.bookingStartAt <= nowIso &&
          nowIso <= summary.bookingEndAt
      )
      .map(
        (summary) =>
          ({
            ...summary,
            occupancyState:
              summary.reservationStatus === "CHECKED_IN" ? "OCCUPIED" : "RESERVED",
          }) satisfies OccupancyRecord
      )
      .sort(compareOperationalReservations);
  }

  async listOperationalActivity(limit: number): Promise<OperationalActivityRecord[]> {
    const rows = await this.request<any[]>(
      `/audit_logs?select=*&action=in.(reservation_checked_in,reservation_checked_out)&order=created_at.desc&limit=${limit}`
    );

    const events = await Promise.all(
      rows.map(async (row) => {
        const summary = await this.loadOperationalReservation(row.entity_id);
        if (!summary) {
          return null;
        }

        return {
          reservationId: summary.reservationId,
          referenceCode: summary.referenceCode,
          customerName: `${summary.customerFirstName} ${summary.customerLastName}`.trim(),
          workspaceDisplayName: summary.workspaceDisplayName,
          workspaceInstanceCode: summary.workspaceInstanceCode,
          activityType:
            row.action === "reservation_checked_out"
              ? "CHECK_OUT"
              : row.metadata?.reentry
                ? "REENTRY"
                : "CHECK_IN",
          occurredAt: row.created_at,
          actorUserId: row.actor_user_id,
          actorRole: row.actor_role,
        } satisfies OperationalActivityRecord;
      })
    );

    return events.filter((event): event is OperationalActivityRecord => event !== null);
  }

  async listReportReservations(): Promise<ReportReservationRecord[]> {
    const reservations = await this.request<any[]>(
      "/reservations?select=*&order=created_at.desc&limit=500"
    );

    const reports = await Promise.all(
      reservations.map((reservation) => this.loadReportReservation(reservation.id, reservation))
    );

    return reports
      .filter((report): report is ReportReservationRecord => report !== null)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  async listReportPaymentAttempts(): Promise<ReportPaymentAttemptRecord[]> {
    const attempts = await this.request<any[]>(
      "/payment_attempts?select=*&order=created_at.desc&limit=500"
    );
    const reservations = await this.request<any[]>(
      "/reservations?select=id,reference_code,amount_due,currency"
    );
    const paymentMethods = await this.request<any[]>(
      "/payment_methods?select=id,method_type,display_name"
    );

    const reservationsById = new Map(
      reservations.map((reservation) => [reservation.id, reservation] as const)
    );
    const paymentMethodsById = new Map(
      paymentMethods.map((method) => [method.id, method] as const)
    );

    return attempts
      .map((attempt) => {
        const reservation = reservationsById.get(attempt.reservation_id);
        const method = attempt.payment_method_id
          ? paymentMethodsById.get(attempt.payment_method_id)
          : null;

        return {
          paymentAttemptId: attempt.id,
          reservationId: attempt.reservation_id,
          reservationReferenceCode: reservation?.reference_code ?? "",
          channel: attempt.channel,
          paymentStatus: attempt.status,
          refundStatus: attempt.refund_status,
          amount: Number(attempt.amount ?? reservation?.amount_due ?? 0),
          currency: reservation?.currency ?? "PHP",
          paymentMethodId: attempt.payment_method_id,
          paymentMethodType: method?.method_type ?? null,
          paymentMethodDisplayName: method?.display_name ?? null,
          createdAt: attempt.created_at,
          proofSubmittedAt: attempt.proof_submitted_at,
          processedAt: attempt.processed_at,
        } satisfies ReportPaymentAttemptRecord;
      })
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  async findGuestReservationTrackingRecord(input: {
    referenceCode: string;
    customerEmail: string;
  }): Promise<GuestReservationTrackingRecord | null> {
    const reservation = (
      await this.request<any[]>(
        `/reservations?select=*&reference_code=eq.${encodeURIComponent(input.referenceCode)}&customer_email=ilike.${encodeURIComponent(input.customerEmail)}&limit=1`
      )
    )?.[0];

    if (!reservation) {
      return null;
    }

    const candidate = (
      await this.request<any[]>(
        `/reservation_candidates?select=*&reservation_id=eq.${encodeURIComponent(reservation.id)}&is_assigned=eq.true&limit=1`
      )
    )?.[0];

    const workspaceInstance = candidate
      ? (
          await this.request<any[]>(
            `/workspace_instances?select=*&id=eq.${encodeURIComponent(candidate.workspace_instance_id)}&limit=1`
          )
        )?.[0]
      : null;
    const workspaceTemplate = workspaceInstance
      ? (
          await this.request<any[]>(
            `/workspace_templates?select=*&id=eq.${encodeURIComponent(workspaceInstance.template_id)}&limit=1`
          )
        )?.[0]
      : null;
    const floor = workspaceInstance
      ? (
          await this.request<any[]>(
            `/floors?select=*&id=eq.${encodeURIComponent(workspaceInstance.floor_id)}&limit=1`
          )
        )?.[0]
      : null;

    return {
      reservationId: reservation.id,
      referenceCode: reservation.reference_code,
      customerEmail: reservation.customer_email,
      reservationStatus: reservation.status,
      amountDue: Number(reservation.amount_due),
      currency: reservation.currency,
      confirmedAt: reservation.confirmed_at,
      checkedOutAt: reservation.checked_out_at,
      finalAssignment: candidate
        ? {
            workspaceInstanceId: candidate.workspace_instance_id,
            workspaceDisplayName:
              workspaceInstance?.display_name ??
              workspaceInstance?.instance_code ??
              candidate.workspace_instance_id,
            workspaceInstanceCode:
              workspaceInstance?.instance_code ?? candidate.workspace_instance_id,
            workspaceTemplateName: workspaceTemplate?.name ?? "Workspace",
            floorName: floor?.name ?? "Unknown Floor",
            bookingStartAt: candidate.start_at,
            bookingEndAt: candidate.end_at,
          }
        : null,
    };
  }

  async checkInReservation(input: {
    reservationId: string;
    actorUserId: string;
    actorRole: "ADMIN" | "STAFF";
    actedAt: string;
  }): Promise<ReservationOperationalActionResult> {
    const result = await this.request<any[]>("/rpc/check_in_reservation", {
      method: "POST",
      body: JSON.stringify({
        p_reservation_id: input.reservationId,
        p_actor_user_id: input.actorUserId,
        p_acted_at: input.actedAt,
      }),
    });

    if (!Array.isArray(result) || result.length === 0) {
      throw new Error("Failed to check in reservation.");
    }

    const summary = await this.loadOperationalReservation(input.reservationId);
    if (!summary) {
      throw new Error("Checked-in reservation could not be loaded.");
    }

    return {
      ...summary,
      action: "CHECK_IN",
      actedAt: input.actedAt,
      actorUserId: input.actorUserId,
      actorRole: input.actorRole,
      reentry: Boolean(result[0].reentry),
    };
  }

  async checkOutReservation(input: {
    reservationId: string;
    actorUserId: string;
    actorRole: "ADMIN" | "STAFF";
    actedAt: string;
  }): Promise<ReservationOperationalActionResult> {
    await this.request<any[]>("/rpc/check_out_reservation", {
      method: "POST",
      body: JSON.stringify({
        p_reservation_id: input.reservationId,
        p_actor_user_id: input.actorUserId,
        p_acted_at: input.actedAt,
      }),
    });

    const summary = await this.loadOperationalReservation(input.reservationId);
    if (!summary) {
      throw new Error("Checked-out reservation could not be loaded.");
    }

    return {
      ...summary,
      action: "CHECK_OUT",
      actedAt: input.actedAt,
      actorUserId: input.actorUserId,
      actorRole: input.actorRole,
      reentry: false,
    };
  }

  private async loadPaymentReview(
    paymentAttemptId: string,
    attemptRow?: any
  ): Promise<PaymentReviewDetail | null> {
    const attempt =
      attemptRow ??
      (
        await this.request<any[]>(
          `/payment_attempts?select=*&id=eq.${encodeURIComponent(paymentAttemptId)}&limit=1`
        )
      )?.[0];

    if (!attempt) {
      return null;
    }

    if (attempt.channel !== "WEB") {
      return null;
    }

    const reservation = (
      await this.request<any[]>(
        `/reservations?select=*&id=eq.${encodeURIComponent(attempt.reservation_id)}&limit=1`
      )
    )?.[0];

    if (!reservation) {
      return null;
    }

    const candidatesRows = await this.request<any[]>(
      `/reservation_candidates?select=*&reservation_id=eq.${encodeURIComponent(reservation.id)}&order=rank.asc`
    );

    const candidates: ReservationCandidate[] = candidatesRows.map((candidate: any) => ({
      id: candidate.id,
      reservationId: candidate.reservation_id,
      rank: candidate.rank,
      workspaceInstanceId: candidate.workspace_instance_id,
      startAt: candidate.start_at,
      endAt: candidate.end_at,
      isAssigned: candidate.is_assigned,
    }));

    return {
      paymentAttemptId: attempt.id,
      reservationId: reservation.id,
      reservationReferenceCode: reservation.reference_code,
      reservationStatus: reservation.status,
      paymentStatus: attempt.status,
      customerFirstName: reservation.customer_first_name,
      customerLastName: reservation.customer_last_name,
      customerEmail: reservation.customer_email,
      amountDue: Number(reservation.amount_due),
      currency: reservation.currency,
      paymentMethodId: attempt.payment_method_id,
      proofSubmittedAt: attempt.proof_submitted_at,
      submittedCandidates: candidates,
      proofStoragePath: attempt.proof_storage_path,
      rejectionReason: attempt.rejection_reason,
      refundStatus: attempt.refund_status,
      processedAt: attempt.processed_at,
      processedByUserId: attempt.processed_by_user_id,
    };
  }

  private mapDecisionResult(row: any): PaymentReviewDecisionResult {
    const assignedCandidate =
      row.assigned_candidate_id && row.assigned_candidate_rank !== null
        ? {
            id: row.assigned_candidate_id,
            reservationId: row.reservation_id,
            rank: row.assigned_candidate_rank,
            workspaceInstanceId: row.assigned_workspace_instance_id,
            startAt: row.assigned_start_at,
            endAt: row.assigned_end_at,
            isAssigned: true,
          }
        : null;

    return {
      paymentAttemptId: row.payment_attempt_id,
      reservationId: row.reservation_id,
      reservationReferenceCode: row.reservation_reference_code,
      reservationStatus: row.reservation_status,
      paymentStatus: row.payment_status,
      refundStatus: row.refund_status,
      assignedCandidate,
      assignedCandidateRank: assignedCandidate?.rank ?? null,
      rejectionReason: row.rejection_reason,
      processedAt: row.processed_at,
      processedByUserId: row.processed_by_user_id,
    };
  }

  private async loadOperationalReservation(
    reservationId: string,
    reservationRow?: any
  ): Promise<StaffOperationalReservation | null> {
    const reservation =
      reservationRow ??
      (
        await this.request<any[]>(
          `/reservations?select=*&id=eq.${encodeURIComponent(reservationId)}&limit=1`
        )
      )?.[0];

    if (!reservation) {
      return null;
    }

    const candidateRows = await this.request<any[]>(
      `/reservation_candidates?select=*&reservation_id=eq.${encodeURIComponent(reservation.id)}&order=rank.asc`
    );

    const candidate =
      candidateRows.find((entry) => entry.is_assigned === true) ?? candidateRows[0] ?? null;

    const workspaceInstance = candidate
      ? (
          await this.request<any[]>(
            `/workspace_instances?select=*&id=eq.${encodeURIComponent(candidate.workspace_instance_id)}&limit=1`
          )
        )?.[0]
      : null;
    const workspaceTemplate = workspaceInstance
      ? (
          await this.request<any[]>(
            `/workspace_templates?select=*&id=eq.${encodeURIComponent(workspaceInstance.template_id)}&limit=1`
          )
        )?.[0]
      : null;
    const floor = workspaceInstance
      ? (
          await this.request<any[]>(
            `/floors?select=*&id=eq.${encodeURIComponent(workspaceInstance.floor_id)}&limit=1`
          )
        )?.[0]
      : null;

    return {
      reservationId: reservation.id,
      referenceCode: reservation.reference_code,
      source: reservation.source,
      customerFirstName: reservation.customer_first_name,
      customerLastName: reservation.customer_last_name,
      customerEmail: reservation.customer_email,
      reservationStatus: reservation.status,
      checkInState: getCheckInState(reservation.checked_in_at, reservation.checked_out_at),
      workspaceInstanceId: candidate?.workspace_instance_id ?? null,
      workspaceDisplayName:
        workspaceInstance?.display_name ?? workspaceInstance?.instance_code ?? null,
      workspaceInstanceCode: workspaceInstance?.instance_code ?? null,
      workspaceTemplateName: workspaceTemplate?.name ?? null,
      floorName: floor?.name ?? null,
      bookingStartAt: candidate?.start_at ?? null,
      bookingEndAt: candidate?.end_at ?? null,
      confirmedAt: reservation.confirmed_at,
      checkedInAt: reservation.checked_in_at,
      checkedOutAt: reservation.checked_out_at,
      qrIssuedAt: reservation.qr_issued_at,
    };
  }

  private async loadReportReservation(
    reservationId: string,
    reservationRow?: any
  ): Promise<ReportReservationRecord | null> {
    const reservation =
      reservationRow ??
      (
        await this.request<any[]>(
          `/reservations?select=*&id=eq.${encodeURIComponent(reservationId)}&limit=1`
        )
      )?.[0];

    if (!reservation) {
      return null;
    }

    const candidateRows = await this.request<any[]>(
      `/reservation_candidates?select=*&reservation_id=eq.${encodeURIComponent(reservation.id)}&order=rank.asc`
    );

    const assignedCandidate =
      candidateRows.find((entry) => entry.is_assigned === true) ?? candidateRows[0] ?? null;

    const workspaceInstance = assignedCandidate
      ? (
          await this.request<any[]>(
            `/workspace_instances?select=*&id=eq.${encodeURIComponent(assignedCandidate.workspace_instance_id)}&limit=1`
          )
        )?.[0]
      : null;
    const workspaceTemplate = workspaceInstance
      ? (
          await this.request<any[]>(
            `/workspace_templates?select=*&id=eq.${encodeURIComponent(workspaceInstance.template_id)}&limit=1`
          )
        )?.[0]
      : null;
    const floor = workspaceInstance
      ? (
          await this.request<any[]>(
            `/floors?select=*&id=eq.${encodeURIComponent(workspaceInstance.floor_id)}&limit=1`
          )
        )?.[0]
      : null;

    return {
      reservationId: reservation.id,
      referenceCode: reservation.reference_code,
      source: reservation.source,
      customerFirstName: reservation.customer_first_name,
      customerLastName: reservation.customer_last_name,
      customerEmail: reservation.customer_email,
      reservationStatus: reservation.status,
      amountDue: Number(reservation.amount_due),
      currency: reservation.currency,
      createdAt: reservation.created_at,
      confirmedAt: reservation.confirmed_at,
      checkedInAt: reservation.checked_in_at,
      checkedOutAt: reservation.checked_out_at,
      bookingStartAt: assignedCandidate?.start_at ?? null,
      bookingEndAt: assignedCandidate?.end_at ?? null,
      assignedCandidateRank: assignedCandidate?.is_assigned ? assignedCandidate.rank : null,
      workspaceDisplayName:
        workspaceInstance?.display_name ?? workspaceInstance?.instance_code ?? null,
      workspaceInstanceCode: workspaceInstance?.instance_code ?? null,
      workspaceTemplateName: workspaceTemplate?.name ?? null,
      floorName: floor?.name ?? null,
    };
  }
}

function getCheckInState(checkedInAt: string | null, checkedOutAt: string | null) {
  if (checkedOutAt) {
    return "CHECKED_OUT" as const;
  }

  if (checkedInAt) {
    return "CHECKED_IN" as const;
  }

  return "NOT_CHECKED_IN" as const;
}

function compareOperationalReservations(
  left: StaffOperationalReservation,
  right: StaffOperationalReservation
) {
  return (left.bookingStartAt ?? "").localeCompare(right.bookingStartAt ?? "");
}
