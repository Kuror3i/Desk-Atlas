import { NextRequest, NextResponse } from "next/server";
import { getAdminPaymentReviewService } from "../../../_lib/paymentReviewService";
import { paymentReviewErrorResponse } from "../../../_lib/errors";
import {
  buildReservationTrackingUrl,
  createBookingAccessService,
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
    const paymentReviewService = getAdminPaymentReviewService();
    const reviewDetail =
      body.decision === "APPROVE"
        ? await paymentReviewService.getPaymentReviewDetail(paymentAttemptId)
        : null;
    let actorUserId = String(body.actorUserId ?? "").trim();
    if (!actorUserId) {
      const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && serviceRoleKey) {
        try {
          const res = await fetch(
            `${supabaseUrl.replace(/\/$/, "")}/rest/v1/staff_profiles?select=user_id&role=eq.ADMIN&is_active=eq.true&limit=1`,
            {
              headers: {
                apikey: serviceRoleKey,
                Authorization: `Bearer ${serviceRoleKey}`,
              },
              cache: "no-store",
            }
          );
          if (res.ok) {
            const adminProfiles = await res.json();
            if (Array.isArray(adminProfiles) && adminProfiles[0]?.user_id) {
              actorUserId = adminProfiles[0].user_id;
            }
          }
        } catch {
          // fallback to actorUserId as-is
        }
      }
    }

    const result = await paymentReviewService.reviewPayment({
      paymentAttemptId,
      actor: {
        userId: actorUserId,
        role: body.actorRole ?? "ADMIN",
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
            trackingUrl,
          });
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    return paymentReviewErrorResponse(error);
  }
}
