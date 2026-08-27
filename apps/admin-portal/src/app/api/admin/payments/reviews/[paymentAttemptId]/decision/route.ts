import { NextRequest, NextResponse } from "next/server";
import { getAdminPaymentReviewService } from "../../../_lib/paymentReviewService";
import { paymentReviewErrorResponse } from "../../../_lib/errors";
import {
  createBookingAccessService,
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
    const paymentReviewService = getAdminPaymentReviewService();
    const reviewDetail =
      body.decision === "APPROVE"
        ? await paymentReviewService.getPaymentReviewDetail(paymentAttemptId)
        : null;
    const result = await paymentReviewService.reviewPayment({
      paymentAttemptId,
      actor: {
        userId: String(body.actorUserId ?? "").trim(),
        role: body.actorRole,
      },
      decision: body.decision,
      rejectionReason: body.rejectionReason,
    });

    if (result.reservationStatus === "CONFIRMED" && result.assignedCandidate && reviewDetail) {
      const reservationRepository = new ReservationSupabaseRepository();
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
            to: reviewDetail.customerEmail,
            customerFirstName: reviewDetail.customerFirstName,
            customerLastName: reviewDetail.customerLastName,
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
    return paymentReviewErrorResponse(error);
  }
}
