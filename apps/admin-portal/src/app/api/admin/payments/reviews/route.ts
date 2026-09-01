import { NextResponse } from "next/server";
import { getAdminPaymentReviewService } from "../_lib/paymentReviewService";
import { paymentReviewErrorResponse } from "../_lib/errors";

export const runtime = "nodejs";

export async function GET() {
  try {
    const queue = await getAdminPaymentReviewService().listPaymentReviewQueue();
    return NextResponse.json({ queue });
  } catch (error) {
    return paymentReviewErrorResponse(error);
  }
}
