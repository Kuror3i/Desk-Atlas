"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAvailability, usePublishedMap, mapPublishedFloorToWorkspaceCards } from "@/features/workspace-discovery";
import type { WorkspaceMapViewModel } from "@/features/workspace-discovery";
import type { ReservationResponseDTO } from "@deskatlas/domain";
import { readJson } from "@/app/lib/api";

interface ReservationResult extends ReservationResponseDTO {}

const durationOptions = [60, 120, 240, 480];

export function ReservationPage() {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [customerFirstName, setCustomerFirstName] = useState("");
  const [customerLastName, setCustomerLastName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReservation, setSubmittedReservation] = useState<ReservationResult | null>(null);

  const today = useMemo(() => formatDate(new Date()), []);
  const monthEnd = useMemo(() => {
    const end = new Date();
    end.setMonth(end.getMonth() + 1);
    return formatDate(end);
  }, []);

  const {
    floorId,
    floors,
    published,
    loading: mapLoading,
    error: mapError,
    setFloorId,
    refetch,
  } = usePublishedMap();

  const workspaces = useMemo(
    () => (published ? mapPublishedFloorToWorkspaceCards(published) : []),
    [published]
  );

  const selectedWorkspace =
    workspaces.find((workspace) => workspace.workspaceInstanceId === selectedWorkspaceId) ?? null;

  const availability = useAvailability({
    workspaceInstanceId: selectedWorkspace?.workspaceInstanceId ?? null,
    startDate: today,
    endDate: monthEnd,
    date: selectedDate,
    durationMinutes,
  });

  const availableDates = useMemo(
    () =>
      new Set(
        availability.dates?.dates
          ?.filter((entry) => entry.isAvailable)
          .map((entry) => entry.date) ?? []
      ),
    [availability.dates]
  );

  const availableSlots = useMemo(
    () => availability.times?.slots?.filter((slot) => slot.isAvailable) ?? [],
    [availability.times]
  );

  const sameTemplateAlternatives = useMemo(() => {
    if (!selectedWorkspace) {
      return [];
    }

    return workspaces.filter(
      (workspace) =>
        workspace.templateId === selectedWorkspace.templateId &&
        workspace.workspaceInstanceId !== selectedWorkspace.workspaceInstanceId &&
        workspace.status === "available"
    );
  }, [selectedWorkspace, workspaces]);

  const amountDue = useMemo(() => {
    if (!selectedWorkspace) {
      return 0;
    }

    return (selectedWorkspace.rateAmount * durationMinutes) / 60;
  }, [durationMinutes, selectedWorkspace]);

  const canSubmit =
    selectedWorkspace &&
    selectedDate &&
    selectedTime &&
    customerFirstName &&
    customerLastName &&
    customerEmail &&
    alternatives.length <= 2;

  async function handleSubmit() {
    if (!selectedWorkspace) {
      setSubmitError("Select a main workspace before submitting.");
      return;
    }

    if (!selectedDate || !selectedTime) {
      setSubmitError("Choose a valid date and time from the backend availability options.");
      return;
    }

    if (!customerFirstName || !customerLastName || !customerEmail) {
      setSubmitError("First name, last name, and email are required.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const startAt = `${selectedDate}T${selectedTime}:00`;
    const endAt = new Date(
      new Date(startAt).getTime() + durationMinutes * 60 * 1000
    ).toISOString();

    try {
      const result = await readJson<ReservationResult>("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: "WEB",
          customerFirstName,
          customerLastName,
          customerEmail,
          candidates: [
            {
              rank: 0,
              workspaceInstanceId: selectedWorkspace.workspaceInstanceId,
              startAt,
              endAt,
            },
            ...alternatives.map((workspaceInstanceId, index) => ({
              rank: (index + 1) as 1 | 2,
              workspaceInstanceId,
              startAt,
              endAt,
            })),
          ],
        }),
      });
      setSubmittedReservation(result);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to create reservation."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submittedReservation) {
    return (
      <main className="min-h-screen bg-[var(--da-canvas)] px-6 py-12">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-[var(--da-border)] bg-white p-8 shadow-[var(--da-shadow-lg)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--da-info)] text-2xl font-bold text-[var(--da-primary)]">
            ✓
          </div>
          <h1 className="mt-5 text-center text-3xl font-extrabold text-[var(--da-brand-dark)]">
            Reservation submitted
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-7 text-[var(--da-text-secondary)]">
            Your request was received without holding inventory. Use the emailed payment link
            to complete payment within one hour, then wait for Admin review and allocation.
          </p>
          <div className="mt-8 grid gap-4 rounded-[24px] bg-[var(--da-canvas)] p-6 md:grid-cols-2">
            <SummaryItem label="Reference" value={submittedReservation.referenceCode} />
            <SummaryItem label="Status" value={submittedReservation.status} />
            <SummaryItem
              label="Amount Due"
              value={`${submittedReservation.currency} ${submittedReservation.amountDue}`}
            />
            <SummaryItem
              label="Payment Link"
              value={
                submittedReservation.paymentSession?.paymentUrl
                  ? "Ready"
                  : "Check your email"
              }
            />
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {submittedReservation.paymentSession?.paymentUrl ? (
              <Link
                href={submittedReservation.paymentSession.paymentUrl}
                className="da-primary-button"
              >
                Open Payment Session
              </Link>
            ) : null}
            <Link href="/track" className="da-secondary-button">
              Track Reservation
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--da-canvas)] px-6 py-8 text-[var(--da-text-primary)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--da-primary)]">
              Reserve
            </p>
            <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.03em] text-[var(--da-brand-dark)]">
              Choose your exact workspace
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--da-text-secondary)]">
              Start with your preferred spot, then use backend-powered dates and times to
              build a guest reservation with up to two alternatives.
            </p>
          </div>
          <Link href="/track" className="da-secondary-button">
            Track Reservation
          </Link>
        </div>

        {mapError ? (
          <div className="rounded-[22px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="font-semibold text-red-900">Published map unavailable</div>
            <p className="mt-1">{mapError}</p>
            <button className="mt-3 da-inline-button" onClick={refetch}>
              Retry map
            </button>
          </div>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-[28px] border border-[var(--da-border)] bg-white p-5 shadow-[var(--da-shadow-lg)]">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-bold text-[var(--da-text-primary)]">
                  Floor
                </label>
                <select
                  value={floorId}
                  onChange={(event) => {
                    setFloorId(event.target.value);
                    setSelectedWorkspaceId(null);
                    setSelectedDate("");
                    setSelectedTime("");
                    setAlternatives([]);
                  }}
                  className="da-input min-w-52"
                >
                  {floors.map((floor) => (
                    <option key={floor.id} value={floor.id}>
                      {floor.name}
                    </option>
                  ))}
                </select>
              </div>
              {mapLoading ? (
                <p className="text-sm font-semibold text-[var(--da-text-secondary)]">
                  Loading published floor map...
                </p>
              ) : null}
            </div>

            {published && workspaces.length > 0 ? (
              <div className="overflow-auto rounded-[24px] border border-[var(--da-border-light)] bg-[var(--da-canvas)] p-4">
                <div
                  className="relative min-h-[34rem]"
                  style={{
                    width: `${published.version.canvasWidth}px`,
                    height: `${published.version.canvasHeight}px`,
                  }}
                >
                  {workspaces.map((workspace) => {
                    const selected =
                      workspace.workspaceInstanceId === selectedWorkspaceId;
                    const disabled = workspace.status !== "available";

                    return (
                      <button
                        key={workspace.workspaceInstanceId}
                        type="button"
                        aria-label={`${workspace.displayName} ${workspace.statusLabel} ${workspace.pricingLabel}`}
                        disabled={disabled}
                        onClick={() => {
                          setSelectedWorkspaceId(workspace.workspaceInstanceId);
                          setAlternatives([]);
                        }}
                        className="absolute flex items-center justify-center border-2 text-center text-xs font-bold text-[var(--da-text-primary)] transition"
                        style={{
                          left: `${workspace.x}px`,
                          top: `${workspace.y}px`,
                          width: `${workspace.width}px`,
                          height: `${workspace.height}px`,
                          borderRadius:
                            workspace.shape === "meeting-room" ? "18px" : "12px",
                          background: getWorkspaceFill(workspace.status),
                          borderColor: selected ? "#C8F451" : "#DCE6DF",
                          boxShadow: selected ? "0 0 0 3px rgba(200, 244, 81, 0.25)" : "none",
                          opacity: disabled ? 0.7 : 1,
                          cursor: disabled ? "not-allowed" : "pointer",
                        }}
                      >
                        {workspace.instanceCode}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-[24px] border border-[var(--da-border-light)] bg-[var(--da-canvas)] p-10 text-center text-sm text-[var(--da-text-secondary)]">
                No published workspaces are available on this floor yet.
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <section className="rounded-[28px] border border-[var(--da-border)] bg-white p-6 shadow-[var(--da-shadow-md)]">
              <h2 className="text-2xl font-extrabold text-[var(--da-brand-dark)]">
                Workspace details
              </h2>
              {!selectedWorkspace ? (
                <p className="mt-4 text-sm leading-7 text-[var(--da-text-secondary)]">
                  Select an available workspace on the published map to review the spot,
                  pricing, and availability.
                </p>
              ) : (
                <div className="mt-5 space-y-4">
                  <div className="rounded-[22px] bg-[var(--da-canvas)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-lg font-extrabold text-[var(--da-brand-dark)]">
                          {selectedWorkspace.displayName}
                        </p>
                        <p className="text-sm text-[var(--da-text-secondary)]">
                          {selectedWorkspace.templateName}
                        </p>
                      </div>
                      <StatusPill workspace={selectedWorkspace} />
                    </div>
                  </div>
                  <p className="text-sm leading-7 text-[var(--da-text-secondary)]">
                    {selectedWorkspace.description}
                  </p>
                  <SummaryItem label="Capacity" value={`${selectedWorkspace.capacity} person(s)`} />
                  <SummaryItem label="Rate" value={selectedWorkspace.pricingLabel} />
                  <SummaryItem label="Floor" value={selectedWorkspace.floorName} />
                </div>
              )}
            </section>

            <section className="rounded-[28px] border border-[var(--da-border)] bg-white p-6 shadow-[var(--da-shadow-md)]">
              <h2 className="text-2xl font-extrabold text-[var(--da-brand-dark)]">
                Schedule
              </h2>
              <div className="mt-5 grid gap-4">
                <label className="grid gap-2 text-sm font-bold">
                  Duration
                  <select
                    value={durationMinutes}
                    onChange={(event) => {
                      setDurationMinutes(Number(event.target.value));
                      setSelectedDate("");
                      setSelectedTime("");
                    }}
                    className="da-input"
                  >
                    {durationOptions.map((option) => (
                      <option key={option} value={option}>
                        {option / 60} hour{option === 60 ? "" : "s"}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-bold">
                  Date
                  <select
                    value={selectedDate}
                    onChange={(event) => {
                      setSelectedDate(event.target.value);
                      setSelectedTime("");
                    }}
                    className="da-input"
                    disabled={!selectedWorkspace}
                  >
                    <option value="">Select an available date</option>
                    {(availability.dates?.dates ?? [])
                      .filter((entry) => entry.isAvailable)
                      .map((entry) => (
                        <option key={entry.date} value={entry.date}>
                          {entry.date}
                        </option>
                      ))}
                  </select>
                </label>
                {selectedWorkspace ? (
                  <p className="text-xs leading-6 text-[var(--da-text-secondary)]">
                    {availability.loadingDates
                      ? "Checking available dates..."
                      : "Choose a date marked available by the backend availability service."}
                  </p>
                ) : null}
                {availability.dateError ? (
                  <p className="rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                    {availability.dateError}
                  </p>
                ) : null}
                {!availability.loadingDates &&
                selectedWorkspace &&
                (availability.dates?.dates?.length ?? 0) === 0 ? (
                  <p className="rounded-[16px] border border-[var(--da-attention)] bg-[var(--da-soft)] px-4 py-3 text-xs text-[var(--da-text-primary)]">
                    No available dates were returned for the selected duration.
                  </p>
                ) : null}
                {selectedDate && selectedWorkspace && !availableDates.has(selectedDate) ? (
                  <p className="rounded-[16px] border border-[var(--da-attention)] bg-[var(--da-soft)] px-4 py-3 text-xs text-[var(--da-text-primary)]">
                    That date is unavailable for the selected duration. Pick another available date.
                  </p>
                ) : null}

                <label className="grid gap-2 text-sm font-bold">
                  Time
                  <select
                    value={selectedTime}
                    onChange={(event) => setSelectedTime(event.target.value)}
                    className="da-input"
                    disabled={!selectedDate || !selectedWorkspace || !availableDates.has(selectedDate)}
                  >
                    <option value="">Select a time slot</option>
                    {availableSlots.map((slot) => (
                      <option key={slot.startTime} value={slot.startTime}>
                        {slot.startTime}
                      </option>
                    ))}
                  </select>
                </label>
                {availability.loadingTimes ? (
                  <p className="text-xs text-[var(--da-text-secondary)]">
                    Loading available time slots...
                  </p>
                ) : null}
                {availability.timeError ? (
                  <p className="rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                    {availability.timeError}
                  </p>
                ) : null}
              </div>
            </section>
          </aside>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[28px] border border-[var(--da-border)] bg-white p-6 shadow-[var(--da-shadow-md)]">
            <h2 className="text-2xl font-extrabold text-[var(--da-brand-dark)]">
              Backup workspaces
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--da-text-secondary)]">
              Optional: select up to two alternatives from the same workspace template.
            </p>
            <div className="mt-5 grid gap-3">
              {sameTemplateAlternatives.length === 0 ? (
                <p className="text-sm text-[var(--da-text-secondary)]">
                  {selectedWorkspace
                    ? "No same-template alternatives are available on this floor right now."
                    : "Select a main workspace first."}
                </p>
              ) : (
                sameTemplateAlternatives.map((workspace) => {
                  const selected = alternatives.includes(workspace.workspaceInstanceId);
                  const disabled = !selected && alternatives.length >= 2;
                  return (
                    <button
                      key={workspace.workspaceInstanceId}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        setAlternatives((current) =>
                          current.includes(workspace.workspaceInstanceId)
                            ? current.filter((entry) => entry !== workspace.workspaceInstanceId)
                            : [...current, workspace.workspaceInstanceId]
                        );
                      }}
                      className={`rounded-[20px] border p-4 text-left transition ${
                        selected
                          ? "border-[var(--da-accent)] bg-[var(--da-info)]"
                          : "border-[var(--da-border-light)] bg-[var(--da-canvas)]"
                      } ${disabled ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-[var(--da-text-primary)]">
                            {workspace.displayName}
                          </p>
                          <p className="text-xs text-[var(--da-text-secondary)]">
                            {workspace.pricingLabel}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-[var(--da-primary)]">
                          {selected ? `Alt ${alternatives.indexOf(workspace.workspaceInstanceId) + 1}` : "Available"}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-[var(--da-border)] bg-white p-6 shadow-[var(--da-shadow-md)]">
            <h2 className="text-2xl font-extrabold text-[var(--da-brand-dark)]">
              Guest details and review
            </h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold">
                First name
                <input
                  value={customerFirstName}
                  onChange={(event) => setCustomerFirstName(event.target.value)}
                  className="da-input"
                  placeholder="Juan"
                />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Last name
                <input
                  value={customerLastName}
                  onChange={(event) => setCustomerLastName(event.target.value)}
                  className="da-input"
                  placeholder="Dela Cruz"
                />
              </label>
              <label className="grid gap-2 text-sm font-bold md:col-span-2">
                Email address
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(event) => setCustomerEmail(event.target.value)}
                  className="da-input"
                  placeholder="guest@example.com"
                />
              </label>
            </div>

            <div className="mt-6 rounded-[24px] bg-[var(--da-canvas)] p-5">
              <h3 className="text-lg font-extrabold text-[var(--da-brand-dark)]">
                Reservation summary
              </h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <SummaryItem
                  label="Main workspace"
                  value={selectedWorkspace?.displayName ?? "Select a workspace"}
                />
                <SummaryItem
                  label="Schedule"
                  value={
                    selectedDate && selectedTime
                      ? `${selectedDate} at ${selectedTime}`
                      : "Choose a date and time"
                  }
                />
                <SummaryItem
                  label="Duration"
                  value={`${durationMinutes / 60} hour${durationMinutes === 60 ? "" : "s"}`}
                />
                <SummaryItem
                  label="Alternatives"
                  value={alternatives.length > 0 ? String(alternatives.length) : "None"}
                />
                <SummaryItem label="Amount due" value={`PHP ${amountDue}`} />
                <SummaryItem label="Inventory hold" value="None until approval + allocation" />
              </div>
            </div>

            {submitError ? (
              <div className="mt-5 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="da-primary-button mt-6 w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Submitting reservation..." : "Submit Reservation"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[var(--da-border-light)] bg-white px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--da-text-secondary)]">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-[var(--da-text-primary)]">{value}</p>
    </div>
  );
}

function StatusPill({ workspace }: { workspace: WorkspaceMapViewModel }) {
  const className =
    workspace.statusTone === "success"
      ? "bg-[var(--da-info)] text-[var(--da-primary)]"
      : workspace.statusTone === "warning"
        ? "bg-[var(--da-attention)] text-[var(--da-primary)]"
        : "bg-[var(--da-canvas)] text-[var(--da-text-secondary)]";

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${className}`}>
      <span aria-hidden="true">{workspace.statusGlyph}</span>
      {workspace.statusLabel}
    </span>
  );
}

function getWorkspaceFill(status: WorkspaceMapViewModel["status"]) {
  switch (status) {
    case "available":
      return "#E0EFE4";
    case "maintenance":
      return "#FCF060";
    case "broken":
    case "unavailable":
      return "#FFFCDD";
    case "inactive":
      return "#F3F7F4";
    default:
      return "#F3F7F4";
  }
}

function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}
