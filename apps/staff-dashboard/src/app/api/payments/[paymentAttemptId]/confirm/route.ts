import { NextRequest, NextResponse } from "next/server";
import {
  buildReservationTrackingUrl,
  CounterPaymentConflictError,
  CounterPaymentError,
  createBookingAccessService,
  createCounterPaymentService,
  createTransactionalEmailService,
  hashBookingToken,
  ReservationSupabaseRepository,
} from "@deskatlas/domain";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      paymentAttemptId: string;
    }>;
  }
) {
  try {
    const { paymentAttemptId } = await context.params;
    const body = await request.json();
    const reservationRepository = new ReservationSupabaseRepository();
    const service = createCounterPaymentService(reservationRepository);

    const code = body.code?.trim() || paymentAttemptId;
    const counterPaymentRecord = await service.getCounterPaymentRecordByCode(code);

    const result = await service.confirmPayment({
      paymentAttemptId: counterPaymentRecord.paymentAttemptId,
      actor: {
        userId: String(body.actor?.userId ?? body.actorUserId ?? "").trim(),
        role: body.actor?.role ?? body.actorRole,
      },
    });

    if (result.reservationStatus === "CONFIRMED" && result.assignedCandidate) {
      const bookingAccessService = createBookingAccessService(reservationRepository);
      const bookingAccessBaseUrl =
        process.env.BOOKING_ACCESS_BASE_URL ??
        `${request.nextUrl.origin.replace(/\/$/, "")}/api/booking`;
      const trackingBaseUrl =
        process.env.TRACKING_BASE_URL ??
        process.env.DESKATLAS_PUBLIC_APP_URL ??
        request.nextUrl.origin.replace(/\/$/, "");
      const trackingUrl = buildReservationTrackingUrl(trackingBaseUrl, result.reservationReferenceCode);
      const bookingAccess = await bookingAccessService.issueBookingAccess(
        result.reservationId,
        result.reservationReferenceCode,
        bookingAccessBaseUrl
      );

      if (bookingAccess) {
        const bookingAccessRecord = await reservationRepository.findBookingAccessByTokenHash(
          hashBookingToken(bookingAccess.token)
        );

        if (bookingAccessRecord) {
          const emailService = createTransactionalEmailService();
          await emailService.sendBookingConfirmationEmail({
            to: counterPaymentRecord.customerEmail,
            customerFirstName: counterPaymentRecord.customerFirstName,
            customerLastName: counterPaymentRecord.customerLastName,
            referenceCode: result.reservationReferenceCode,
            workspaceDisplayName: bookingAccessRecord.assignedWorkspaceDisplayName,
            workspaceTemplateName: bookingAccessRecord.assignedWorkspaceTemplateName,
            floorName: bookingAccessRecord.assignedFloorName,
            bookingStartAt: bookingAccessRecord.assignedStartAt,
            bookingEndAt: bookingAccessRecord.assignedEndAt,
            bookingAccessUrl: bookingAccess.accessUrl,
            bookingToken: bookingAccess.token,
            qrIssuedAt: bookingAccess.issuedAt,
            trackingUrl,
          });
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CounterPaymentError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof CounterPaymentConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    const message =
      error instanceof Error ? error.message : "Unable to confirm kiosk counter payment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
