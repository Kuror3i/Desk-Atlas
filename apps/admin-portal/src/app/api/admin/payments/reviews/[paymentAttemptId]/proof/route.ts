import { NextResponse } from "next/server";
import { getAdminPaymentReviewService } from "../../../_lib/paymentReviewService";
import { paymentReviewErrorResponse } from "../../../_lib/errors";

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

    if (!detail.proofStoragePath) {
      return NextResponse.json({ error: "Payment proof is not available." }, { status: 404 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration is missing.");
    }

    const bucketName = process.env.PRIVATE_PAYMENT_PROOF_BUCKET ?? "payment-proofs";
    const encodedPath = detail.proofStoragePath
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");
    const response = await fetch(
      `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/sign/${bucketName}/${encodedPath}`,
      {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expiresIn: 60 }),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = (await response.json()) as {
      signedURL?: string;
      signedUrl?: string;
    };
    const relativeUrl = data.signedURL ?? data.signedUrl;
    if (!relativeUrl) {
      throw new Error("Failed to create payment proof URL.");
    }
    const signedUrl = relativeUrl.startsWith("http")
      ? relativeUrl
      : `${supabaseUrl.replace(/\/$/, "")}/storage/v1${relativeUrl}`;

    return NextResponse.json({
      paymentAttemptId: detail.paymentAttemptId,
      proofStoragePath: detail.proofStoragePath,
      signedUrl,
      expiresInSeconds: 60,
    });
  } catch (error) {
    return paymentReviewErrorResponse(error);
  }
}
