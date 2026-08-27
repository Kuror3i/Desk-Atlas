import { NextRequest, NextResponse } from "next/server";
import {
  CounterPaymentConflictError,
  CounterPaymentError,
  createBookingAccessService,
  createCounterPaymentService,
  hashBookingToken,
  ReservationSupabaseRepository,
} from "@deskatlas/domain";

export const runtime = "nodejs";

async function dispatchBookingConfirmationEmail(input: {
  to: string;
  customerFirstName: string;
  customerLastName: string;
  referenceCode: string;
  workspaceDisplayName: string;
  workspaceTemplateName: string;
  floorName: string;
  bookingStartAt: string;
  bookingEndAt: string;
  bookingAccessUrl: string;
  bookingToken: string;
  qrIssuedAt: string;
}) {
  const webhookUrl = process.env.TRANSACTIONAL_EMAIL_WEBHOOK_URL;

  if (!webhookUrl) {
    console.info(
      "Booking confirmation email dispatch skipped; no TRANSACTIONAL_EMAIL_WEBHOOK_URL configured.",
      input
    );
    return;
  }

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      template: "booking-confirmed",
      ...input,
    }),
  });
}

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
    const counterPaymentService = createCounterPaymentService(reservationRepository);
    const counterPaymentRecord = await counterPaymentService.getCounterPaymentRecord(paymentAttemptId);
    const result = await counterPaymentService.confirmPayment({
      paymentAttemptId,
      actor: {
        userId: String(body.actorUserId ?? "").trim(),
        role: body.actorRole,
      },
    });

    if (result.reservationStatus === "CONFIRMED" && result.assignedCandidate) {
      const bookingAccessService = createBookingAccessService(reservationRepository);
      const bookingAccessBaseUrl =
        process.env.BOOKING_ACCESS_BASE_URL ??
        `${request.nextUrl.origin.replace(/\/$/, "")}/api/booking`;
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
          await dispatchBookingConfirmationEmail({
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
      error instanceof Error ? error.message : "Unable to confirm kiosk counter payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
