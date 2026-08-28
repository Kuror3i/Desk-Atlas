"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePaymentSession } from "../hooks/usePaymentSession";

export function PaymentSessionPage({ token }: { token: string }) {
  const { data, loading, error, refetch } = usePaymentSession(token);
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!paymentMethodId && data?.paymentMethods?.[0]?.id) {
      setPaymentMethodId(data.paymentMethods[0].id);
    }
  }, [data, paymentMethodId]);

  const remainingSeconds = useMemo(() => {
    if (!data?.expiresAt) {
      return 0;
    }

    return Math.max(0, Math.floor((new Date(data.expiresAt).getTime() - now) / 1000));
  }, [data?.expiresAt, now]);

  const isExpired =
    data?.paymentStatus === "EXPIRED" ||
    data?.reservationStatus === "EXPIRED" ||
    (!loading && !!data?.expiresAt && remainingSeconds === 0 && !data?.proofSubmittedAt);

  const isUnderReview =
    data?.paymentStatus === "UNDER_REVIEW" ||
    data?.reservationStatus === "PAYMENT_UNDER_REVIEW" ||
    submitted;

  async function handleSubmit() {
    if (!paymentMethodId) {
      setSubmitError("Choose a payment method before uploading proof.");
      return;
    }

    if (!proof) {
      setSubmitError("Attach your payment proof file before submitting.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    const formData = new FormData();
    formData.set("paymentMethodId", paymentMethodId);
    formData.set("proof", proof);

    try {
      const response = await fetch(`/api/pay/${encodeURIComponent(token)}/proof`, {
        method: "POST",
        body: formData,
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? "Unable to submit payment proof.");
      }
      setSubmitted(true);
      refetch();
    } catch (nextError) {
      setSubmitError(
        nextError instanceof Error ? nextError.message : "Unable to submit payment proof."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--da-canvas)] px-6 py-12">
      <div className="mx-auto max-w-4xl rounded-[28px] border border-[var(--da-border)] bg-white p-8 shadow-[var(--da-shadow-lg)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--da-primary)]">
              Payment Session
            </p>
            <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.03em] text-[var(--da-brand-dark)]">
              Complete your payment
            </h1>
          </div>
          <Link href="/track" className="da-secondary-button">
            Track Reservation
          </Link>
        </div>

        {loading ? (
          <div className="mt-8 rounded-[22px] bg-[var(--da-canvas)] p-6 text-sm text-[var(--da-text-secondary)]">
            Loading payment session...
          </div>
        ) : null}

        {error ? (
          <div className="mt-8 rounded-[22px] border border-red-200 bg-red-50 p-6">
            <p className="font-semibold text-red-900">Payment session unavailable</p>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <button className="mt-4 da-inline-button" onClick={refetch}>
              Retry
            </button>
          </div>
        ) : null}

        {!loading && !error && data ? (
          <>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <Panel label="Reference" value={data.reservationReferenceCode} />
              <Panel label="Guest" value={`${data.customerFirstName} ${data.customerLastName}`} />
              <Panel label="Amount Due" value={`${data.currency} ${data.amountDue}`} />
              <Panel
                label="Status"
                value={
                  isUnderReview
                    ? "Payment under review"
                    : isExpired
                      ? "Payment session expired"
                      : "Awaiting proof submission"
                }
              />
            </div>

            {isUnderReview ? (
              <StateBox
                tone="info"
                title="Payment under review"
                body="Your proof was accepted by the server before expiry. Admin review and allocation are now pending."
              />
            ) : isExpired ? (
              <StateBox
                tone="warning"
                title="Payment session expired"
                body="This one-hour payment session is no longer accepting proof uploads."
              />
            ) : (
              <StateBox
                tone="success"
                title="Upload proof before the timer ends"
                body={`Time remaining: ${formatCountdown(remainingSeconds)}. The deadline stops only after successful server-accepted proof submission.`}
              />
            )}

            {!isUnderReview && !isExpired ? (
              <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
                <section className="rounded-[24px] bg-[var(--da-canvas)] p-5">
                  <h2 className="text-xl font-extrabold text-[var(--da-brand-dark)]">
                    Payment methods
                  </h2>
                  <div className="mt-4 grid gap-3">
                    {data.paymentMethods.map((method) => (
                      <label
                        key={method.id}
                        className="rounded-[18px] border border-[var(--da-border-light)] bg-white p-4"
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="paymentMethodId"
                            value={method.id}
                            checked={paymentMethodId === method.id}
                            onChange={(event) => setPaymentMethodId(event.target.value)}
                            className="mt-1"
                          />
                          <div className="space-y-1">
                            <p className="font-bold text-[var(--da-text-primary)]">
                              {method.displayName}
                            </p>
                            <p className="text-sm text-[var(--da-text-secondary)]">
                              {method.instructions ?? "Follow the posted payment instructions."}
                            </p>
                            {method.accountName ? (
                              <p className="text-xs text-[var(--da-text-secondary)]">
                                Account name: {method.accountName}
                              </p>
                            ) : null}
                            {method.accountNumber ? (
                              <p className="text-xs text-[var(--da-text-secondary)]">
                                Account number: {method.accountNumber}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </section>

                <section className="rounded-[24px] border border-[var(--da-border)] bg-white p-5">
                  <h2 className="text-xl font-extrabold text-[var(--da-brand-dark)]">
                    Upload payment proof
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[var(--da-text-secondary)]">
                    Submit one proof file before expiry. Duplicate submissions are rejected once proof is accepted.
                  </p>
                  <label className="mt-5 grid gap-2 text-sm font-bold">
                    Proof file
                    <input
                      type="file"
                      onChange={(event) => setProof(event.target.files?.[0] ?? null)}
                      className="da-input"
                    />
                  </label>
                  {submitError ? (
                    <div className="mt-4 rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {submitError}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="da-primary-button mt-6 w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Submitting proof..." : "Submit Proof"}
                  </button>
                </section>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </main>
  );
}

function Panel({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] bg-[var(--da-canvas)] px-5 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--da-text-secondary)]">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-[var(--da-text-primary)]">{value}</p>
    </div>
  );
}

function StateBox({
  tone,
  title,
  body,
}: {
  tone: "success" | "warning" | "info";
  title: string;
  body: string;
}) {
  const style =
    tone === "success"
      ? "border-[var(--da-border)] bg-[var(--da-soft)] text-[var(--da-text-primary)]"
      : tone === "warning"
        ? "border-[#F3D07A] bg-[#FFF6DD] text-[var(--da-text-primary)]"
        : "border-[var(--da-border)] bg-[var(--da-info)] text-[var(--da-primary)]";

  return (
    <div className={`mt-6 rounded-[22px] border p-5 ${style}`}>
      <p className="font-bold">{title}</p>
      <p className="mt-2 text-sm leading-7">{body}</p>
    </div>
  );
}

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
