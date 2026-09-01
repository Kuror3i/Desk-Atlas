import { NextResponse } from "next/server";
import { getAdminPaymentReviewService } from "../../_lib/paymentReviewService";
import { paymentReviewErrorResponse } from "../../_lib/errors";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      paymentAttemptId: string;
    }>;
  }
) {
  try {
    const { paymentAttemptId } = await context.params;
    const detail = await getAdminPaymentReviewService().getPaymentReviewDetail(paymentAttemptId);
    return NextResponse.json(detail);
  } catch (error) {
    return paymentReviewErrorResponse(error);
  }
}
