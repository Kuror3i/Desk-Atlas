import { NextRequest, NextResponse } from "next/server";
import {
  CounterPaymentConflictError,
  CounterPaymentError,
  createCounterPaymentService,
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
    const service = createCounterPaymentService(new ReservationSupabaseRepository());
    const result = await service.confirmPayment({
      paymentAttemptId,
      actor: {
        userId: String(body.actorUserId ?? "").trim(),
        role: body.actorRole,
      },
    });

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
