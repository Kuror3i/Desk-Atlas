import { NextResponse } from "next/server";
import { PaymentReviewConflictError, PaymentReviewError } from "@deskatlas/domain";

export function paymentReviewErrorResponse(error: unknown) {
  if (error instanceof PaymentReviewError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof PaymentReviewConflictError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  const message = error instanceof Error ? error.message : "Payment review request failed";
  return NextResponse.json({ error: message }, { status: 500 });
}
