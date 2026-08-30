"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import {
  usePublishedMap,
  mapPublishedFloorToWorkspaceCards,
  getWorkspacePhotoObjectPosition,
} from "@/features/workspace-discovery";
import type { WorkspaceMapViewModel } from "@/features/workspace-discovery";
import {
  computeFitViewZoom,
  clampMapZoom,
  getSavedMapZoom,
  saveMapZoom,
  DEFAULT_MAP_CANVAS_WIDTH,
  DEFAULT_MAP_CANVAS_HEIGHT,
  DEFAULT_MAP_GRID_SIZE,
  type PublishedMapElement,
} from "@deskatlas/domain";
import { useRouter } from "next/navigation";
import { SpotDetailModal } from "./SpotDetailModal";
import { ScheduleCalendarStep } from "./ScheduleCalendarStep";
import { EmailConfirmationModal } from "./EmailConfirmationModal";

export interface SelectedCandidate {
  rank: 0 | 1 | 2;
  workspace: WorkspaceMapViewModel;
  date: string;
  durationHours: number;
  startTime: string;
  endTime: string;
}

function getContrastColor(hexColor?: string): string {
  if (!hexColor || !hexColor.startsWith("#") || hexColor.length < 7) return "#111827";
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? "#111827" : "#ffffff";
}

function formatTime12Hour(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  let hour = parseInt(hStr, 10);
  const minute = mStr || "00";
  const period = hour >= 12 ? "PM" : "AM";
  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;
  return `${hour}:${minute} ${period}`;
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return dateObj.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function AmenityIcon({ type, name, color }: { type?: string; name?: string; color?: string }) {
  const norm = (type || name || "").toLowerCase();
  const iconColor = color || "#1e293b";

  if (
    norm.includes("restroom") ||
    norm.includes("toilet") ||
    norm.includes("bath") ||
    norm.includes("cr") ||
    norm.includes("washroom")
  ) {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-label="Restroom"
      >
        <circle cx="8" cy="5" r="2" fill={iconColor} stroke="none" />
        <path d="M8 8v6M6 10h4M7 14v6M9 14v6" stroke={iconColor} strokeWidth="1.75" />
        <circle cx="16" cy="5" r="2" fill={iconColor} stroke="none" />
        <path d="M14 10l2-2 2 2M16 8v3M14 14l1-3h2l1 3M15 14v6M17 14v6" stroke={iconColor} strokeWidth="1.75" />
      </svg>
    );
  }

  if (
    norm.includes("pantry") ||
    norm.includes("kitchen") ||
    norm.includes("dining") ||
    norm.includes("cafe") ||
    norm.includes("coffee") ||
    norm.includes("snack")
  ) {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-label="Pantry"
      >
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    );
  }

  if (norm.includes("exit") || norm.includes("emergency")) {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-label="Emergency Exit"
      >
        <path d="M13 4h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" />
        <path d="M3 12h11" />
        <path d="M10 8l4 4-4 4" />
        <circle cx="6" cy="7" r="1.5" fill={iconColor} stroke="none" />
        <path d="M6 9v3l-2 2" stroke={iconColor} strokeWidth="1.75" />
      </svg>
    );
  }

  if (norm.includes("door")) {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-label="Doorway"
      >
        <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14" />
        <path d="M2 20h20" />
        <circle cx="14" cy="12" r="1" fill={iconColor} />
      </svg>
    );
  }

  return null;
}

export function ReservationPage() {
  const router = useRouter();
  const [step, setStep] = useState<"map" | "schedule" | "backup-prompt" | "summary" | "email-handoff">("map");
  const [activeRank, setActiveRank] = useState<0 | 1 | 2>(0);
  const [candidates, setCandidates] = useState<SelectedCandidate[]>([]);

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [modalWorkspace, setModalWorkspace] = useState<WorkspaceMapViewModel | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templateMismatchWarning, setTemplateMismatchWarning] = useState<string | null>(null);

  // Guest customer detail fields (MF-23)
  const [customerFirstName, setCustomerFirstName] = useState("");
  const [customerLastName, setCustomerLastName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [formErrors, setFormErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailConfirmOpen, setIsEmailConfirmOpen] = useState(false);
  const [submittedReservation, setSubmittedReservation] = useState<{
    referenceCode: string;
    customerEmail: string;
  } | null>(null);
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null);
  const [candidateImageErrors, setCandidateImageErrors] = useState<Record<string, boolean>>({});

  const [zoom, setZoom] = useState(1);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const {
    floorId,
    floors,
    published,
    loading: mapLoading,
    error: mapError,
    setFloorId,
    refetch,
  } = usePublishedMap();

  const canvasDimensions = useMemo(() => {
    return {
      width: Number(published?.version?.canvasWidth) || DEFAULT_MAP_CANVAS_WIDTH,
      height: Number(published?.version?.canvasHeight) || DEFAULT_MAP_CANVAS_HEIGHT,
      gridSize: Number(published?.version?.gridSize) || DEFAULT_MAP_GRID_SIZE,
    };
  }, [published]);

  const workspaces = useMemo(
    () => (published ? mapPublishedFloorToWorkspaceCards(published) : []),
    [published]
  );

  const mainCandidate = useMemo(
    () => candidates.find((c) => c.rank === 0) ?? null,
    [candidates]
  );

  const backup1Candidate = useMemo(
    () => candidates.find((c) => c.rank === 1) ?? null,
    [candidates]
  );

  const backup2Candidate = useMemo(
    () => candidates.find((c) => c.rank === 2) ?? null,
    [candidates]
  );

  const selectedWorkspace = useMemo(
    () => workspaces.find((w) => w.workspaceInstanceId === selectedWorkspaceId) ?? null,
    [workspaces, selectedWorkspaceId]
  );

  const elements = published?.elements || [];

  // Parity with Admin & Staff map viewports: auto fit on load/resize and restore saved zoom
  useEffect(() => {
    if (!mapContainerRef.current || !floorId) return;
    const checkAndFit = () => {
      if (!mapContainerRef.current) return;
      const savedZoom = getSavedMapZoom(floorId);
      if (savedZoom !== null) {
        setZoom(savedZoom);
      } else if (mapContainerRef.current.clientWidth > 0 && mapContainerRef.current.clientHeight > 0) {
        const fitZoom = computeFitViewZoom(
          mapContainerRef.current.clientWidth,
          mapContainerRef.current.clientHeight,
          canvasDimensions.width,
          canvasDimensions.height,
          0
        );
        setZoom(fitZoom);
      }
    };

    const timeout = setTimeout(checkAndFit, 60);
    window.addEventListener("resize", checkAndFit);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", checkAndFit);
    };
  }, [floorId, canvasDimensions.width, canvasDimensions.height, mapLoading]);

  const handleFitView = () => {
    if (!mapContainerRef.current) {
      setZoom(1);
      return;
    }
    const fitZoom = computeFitViewZoom(
      mapContainerRef.current.clientWidth,
      mapContainerRef.current.clientHeight,
      canvasDimensions.width,
      canvasDimensions.height,
      0
    );
    setZoom(fitZoom);
    if (floorId) {
      saveMapZoom(floorId, fitZoom);
    }
  };

  const handleZoomIn = () => {
    setZoom((z) => {
      const next = clampMapZoom(Number((z + 0.1).toFixed(2)));
      if (floorId) saveMapZoom(floorId, next);
      return next;
    });
  };

  const handleZoomOut = () => {
    setZoom((z) => {
      const next = clampMapZoom(Number((z - 0.1).toFixed(2)));
      if (floorId) saveMapZoom(floorId, next);
      return next;
    });
  };

  const handleFloorChange = (newFloorId: string) => {
    setFloorId(newFloorId);
    setSelectedWorkspaceId(null);
    setTemplateMismatchWarning(null);
  };

  const handleSaveCandidateSchedule = (schedule: {
    date: string;
    durationHours: number;
    startTime: string;
    endTime: string;
  }) => {
    if (!selectedWorkspace) return;

    const newCandidate: SelectedCandidate = {
      rank: activeRank,
      workspace: selectedWorkspace,
      date: schedule.date,
      durationHours: schedule.durationHours,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
    };

    setCandidates((prev) => {
      const filtered = prev.filter((c) => c.rank !== activeRank);
      const updated = [...filtered, newCandidate].sort((a, b) => a.rank - b.rank);
      return updated;
    });

    setSelectedWorkspaceId(null);

    // If we just saved Backup 2, advance to summary
    if (activeRank === 2) {
      setStep("summary");
    } else {
      // For Main (0) or Backup 1 (1), show the linear backup prompt
      setStep("backup-prompt");
    }
  };

  const handleStartAddBackup = (rank: 1 | 2) => {
    setActiveRank(rank);
    setSelectedWorkspaceId(null);
    setTemplateMismatchWarning(null);
    setStep("map");
  };

  const handleRemoveCandidate = (rankToRemove: 1 | 2) => {
    setCandidates((prev) => {
      if (rankToRemove === 2) {
        return prev.filter((c) => c.rank !== 2);
      }
      // If removing Backup 1 and Backup 2 exists, shift Backup 2 to Backup 1
      const main = prev.find((c) => c.rank === 0);
      const b2 = prev.find((c) => c.rank === 2);
      const result: SelectedCandidate[] = [];
      if (main) result.push(main);
      if (b2) {
        result.push({
          ...b2,
          rank: 1,
        });
      }
      return result;
    });
  };

  // Step 1: Validate customer details and open email confirmation modal (MF-35)
  const handleSubmitReservation = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const errors: { firstName?: string; lastName?: string; email?: string } = {};
    if (!customerFirstName.trim()) {
      errors.firstName = "First name is required.";
    }
    if (!customerLastName.trim()) {
      errors.lastName = "Last name is required.";
    }
    const emailVal = customerEmail.trim();
    if (!emailVal) {
      errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      errors.email = "Please enter a valid email address.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setSubmitErrorMessage(null);
    setIsEmailConfirmOpen(true);
  };

  // Step 2: Customer confirmed email in modal, submit to server and transition to email-handoff (MF-35)
  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    setSubmitErrorMessage(null);

    try {
      const candidatesPayload = candidates.map((c) => ({
        rank: c.rank,
        workspaceInstanceId: c.workspace.workspaceInstanceId,
        startAt: `${c.date}T${c.startTime}:00Z`,
        endAt: `${c.date}T${c.endTime}:00Z`,
      }));

      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "WEB",
          customerFirstName: customerFirstName.trim(),
          customerLastName: customerLastName.trim(),
          customerEmail: customerEmail.trim().toLowerCase(),
          candidates: candidatesPayload,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create reservation. Please try again.");
      }

      setSubmittedReservation({
        referenceCode: result.referenceCode || "DA-REF",
        customerEmail: customerEmail.trim().toLowerCase(),
      });
      setIsEmailConfirmOpen(false);
      setIsSubmitting(false);
      setStep("email-handoff");
    } catch (err: any) {
      setSubmitErrorMessage(err.message || "An unexpected error occurred. Please try again.");
      setIsEmailConfirmOpen(false);
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--da-canvas)] px-3 sm:px-6 md:px-8 py-5 sm:py-6 text-[var(--da-text-primary)] w-full">
      <div className="mx-auto flex max-w-[1600px] w-full flex-col gap-6">
        {/* Header & Step Flow */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]">
              <button
                type="button"
                onClick={() => {
                  if (step !== "email-handoff") {
                    setActiveRank(0);
                    setStep("map");
                  }
                }}
                className={`hover:underline ${
                  step === "map" && activeRank === 0
                    ? "text-[var(--da-primary)]"
                    : mainCandidate
                    ? "text-emerald-700 font-extrabold"
                    : "text-[var(--da-text-secondary)]"
                }`}
              >
                1. Main Spot {mainCandidate ? `(✓ ${mainCandidate.workspace.displayName})` : ""}
              </button>
              <span className="text-[var(--da-text-secondary)]">/</span>
              <button
                type="button"
                disabled={!mainCandidate || step === "email-handoff"}
                onClick={() => {
                  if (mainCandidate && step !== "email-handoff") setStep("backup-prompt");
                }}
                className={`hover:underline ${
                  step === "backup-prompt" || (step === "map" && activeRank > 0) || (step === "schedule" && activeRank > 0)
                    ? "text-[var(--da-primary)] font-extrabold"
                    : candidates.length > 1
                    ? "text-emerald-700 font-extrabold"
                    : "text-[var(--da-text-secondary)]"
                }`}
              >
                2. Backups (Optional) {candidates.length > 1 ? `(✓ ${candidates.length - 1} Added)` : ""}
              </button>
              <span className="text-[var(--da-text-secondary)]">/</span>
              <button
                type="button"
                disabled={!mainCandidate || step === "email-handoff"}
                onClick={() => {
                  if (mainCandidate && step !== "email-handoff") setStep("summary");
                }}
                className={`hover:underline ${
                  step === "summary"
                    ? "text-[var(--da-primary)] font-extrabold"
                    : step === "email-handoff"
                    ? "text-emerald-700 font-extrabold"
                    : "text-[var(--da-text-secondary)]"
                }`}
              >
                3. Review & Details
              </button>
              {step === "email-handoff" ? (
                <>
                  <span className="text-[var(--da-text-secondary)]">/</span>
                  <span className="text-[var(--da-primary)] font-extrabold">
                    4. Check Email (✓)
                  </span>
                </>
              ) : null}
            </div>

            <h1 className="mt-1 text-3xl sm:text-4xl font-extrabold tracking-[-0.03em] text-[var(--da-brand-dark)]">
              {step === "email-handoff"
                ? "Check Your Email"
                : step === "summary"
                ? "Review Your Ranked Candidates"
                : step === "backup-prompt"
                ? "Add Optional Backup Spots"
                : activeRank > 0
                ? `Choose Backup Spot ${activeRank} (Optional)`
                : step === "map"
                ? "Choose your exact workspace"
                : "Select date, duration & time"}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--da-text-secondary)]">
              {step === "email-handoff"
                ? "Your reservation request has been created. Follow the instructions in the email sent to you to complete payment."
                : step === "summary"
                ? "Review your selected Main and backup workspaces. Ranked candidates are allocated atomically when payment is approved."
                : step === "backup-prompt"
                ? "Increase your chance of getting a spot by adding up to 2 alternative workspaces of the same type and price."
                : activeRank > 0
                ? `Pick an alternative ${mainCandidate?.workspace.templateName || "workspace"} spot for Backup ${activeRank}. Date and duration are locked to match Main.`
                : step === "map"
                ? "Explore the published floor map, select your preferred workspace, and proceed with guest booking."
                : "Choose your booking date, select duration in hours first, then pick an available start time."}
            </p>
          </div>
        </div>

        {/* 0. Post-Submit Email Handoff Screen (MF-35) */}
        {step === "email-handoff" ? (
          <section className="flex flex-col gap-6">
            <div className="mx-auto w-full max-w-3xl rounded-[28px] border border-[var(--da-border)] bg-white p-6 sm:p-10 shadow-[var(--da-shadow-lg)] text-center flex flex-col items-center">
              {/* Icon Badge */}
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--da-canvas)] border-2 border-[var(--da-primary)] text-3xl sm:text-4xl shadow-sm">
                ✉️
              </div>

              <span className="rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3.5 py-1 uppercase tracking-wider mb-2">
                Reservation Submitted • Action Required
              </span>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--da-brand-dark)]">
                Check Your Email to Complete Payment
              </h2>

              <p className="mt-2 text-sm text-[var(--da-text-secondary)] max-w-lg leading-relaxed">
                We have dispatched a private, secure 1-hour payment session link directly to your inbox.
              </p>

              {/* Recipient Email Box */}
              <div className="mt-6 w-full rounded-2xl border-2 border-[var(--da-primary)] bg-[var(--da-canvas)] p-5 text-center shadow-sm">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--da-primary)] block mb-1">
                  Payment Link Sent To
                </span>
                <p className="text-lg sm:text-xl font-extrabold text-[var(--da-brand-dark)] break-all select-all">
                  {submittedReservation?.customerEmail || customerEmail.trim().toLowerCase()}
                </p>
                <p className="mt-1 text-xs text-[var(--da-text-secondary)]">
                  Please open this email to view your payment QR and upload your payment proof.
                </p>
              </div>

              {/* Reference Code Badge */}
              {submittedReservation?.referenceCode ? (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-100 border border-slate-200 px-4 py-2 text-xs text-slate-700">
                  <span className="text-slate-500 font-medium">Reservation Reference:</span>
                  <span className="font-mono font-extrabold text-sm text-[var(--da-brand-dark)]">
                    #{submittedReservation.referenceCode}
                  </span>
                </div>
              ) : null}

              {/* Guidance Cards Grid */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left w-full">
                {/* Spam guidance */}
                <div className="rounded-2xl bg-amber-50/70 border border-amber-200 p-4 text-xs text-amber-900 flex flex-col gap-1.5">
                  <div className="font-bold text-amber-950 flex items-center gap-1.5">
                    <span>📁</span> Check Spam / Junk Folder
                  </div>
                  <p className="leading-relaxed">
                    If you don&apos;t see the message in your main inbox within 1–2 minutes, please check your <strong>Spam, Junk, or Promotions folder</strong>.
                  </p>
                </div>

                {/* 1-Hour window */}
                <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200 p-4 text-xs text-emerald-950 flex flex-col gap-1.5">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>⏱️</span> 1-Hour Payment Window
                  </div>
                  <p className="leading-relaxed">
                    Your online payment session expires in <strong>1 hour</strong>. Once your proof of payment is submitted and approved by admin, your spot will be locked.
                  </p>
                </div>
              </div>

              {/* No Hold Reminder */}
              <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-600 text-left w-full leading-relaxed">
                <span className="font-bold text-slate-800">🔒 DeskAtlas No-Hold Policy:</span> Submitting a guest reservation does not hold physical inventory until payment proof is approved. Payment approval atomically locks your Main choice or your next available backup.
              </div>

              {/* CTA Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full pt-4 border-t border-[var(--da-border-light)]">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="da-primary-button w-full sm:w-auto text-sm font-extrabold px-8 py-3.5 shadow-md flex items-center justify-center gap-2"
                >
                  <span>Return to Home</span>
                  <span>→</span>
                </button>

                {submittedReservation?.referenceCode ? (
                  <button
                    type="button"
                    onClick={() => router.push(`/track/${submittedReservation.referenceCode}`)}
                    className="da-secondary-button w-full sm:w-auto text-sm font-bold px-6 py-3.5"
                  >
                    Track Reservation Status
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => router.push("/track")}
                    className="da-secondary-button w-full sm:w-auto text-sm font-bold px-6 py-3.5"
                  >
                    Track Reservation
                  </button>
                )}
              </div>
            </div>
          </section>
        ) : step === "schedule" && selectedWorkspace ? (
          <ScheduleCalendarStep
            workspace={selectedWorkspace}
            candidateRank={activeRank}
            lockedSchedule={
              activeRank > 0 && mainCandidate
                ? {
                    date: mainCandidate.date,
                    durationHours: mainCandidate.durationHours,
                    initialStartTime:
                      selectedWorkspace.workspaceInstanceId === mainCandidate.workspace.workspaceInstanceId
                        ? undefined
                        : mainCandidate.startTime,
                    excludedStartTimes: candidates
                      .filter(
                        (c) =>
                          c.workspace.workspaceInstanceId === selectedWorkspace.workspaceInstanceId &&
                          c.rank !== activeRank
                      )
                      .map((c) => c.startTime),
                  }
                : undefined
            }
            onBackToMap={() => setStep("map")}
            onContinue={handleSaveCandidateSchedule}
          />
        ) : step === "backup-prompt" && mainCandidate ? (
          /* 2. Linear Backup Offer Prompt */
          <section className="flex flex-col gap-6">
            {/* Current Selected Candidates Stack */}
            <div className="rounded-[28px] border border-[var(--da-border)] bg-white p-6 sm:p-8 shadow-[var(--da-shadow-lg)]">
              <div className="flex items-center justify-between border-b border-[var(--da-border-light)] pb-4 mb-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--da-primary)]">
                    Progress Summary
                  </span>
                  <h2 className="text-2xl font-extrabold text-[var(--da-brand-dark)]">
                    {candidates.length === 1
                      ? "Main Workspace Selected"
                      : `${candidates.length} Spots Configured (Main + ${candidates.length - 1} Backup)`}
                  </h2>
                </div>
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1 text-xs font-extrabold text-emerald-800">
                  {candidates.length} / 3 Candidates
                </span>
              </div>

              {/* Candidate Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Main Card */}
                <div className="rounded-2xl border-2 border-[var(--da-primary)] bg-[var(--da-canvas)] p-5 relative shadow-sm">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="rounded-full bg-[var(--da-primary)] text-white px-2.5 py-0.5 text-xs font-extrabold">
                      👑 Main Choice
                    </span>
                    <span className="text-xs font-bold text-[var(--da-text-secondary)]">
                      {mainCandidate.workspace.floorName}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-[var(--da-brand-dark)]">
                    {mainCandidate.workspace.displayName}
                  </h3>
                  <p className="text-xs text-[var(--da-text-secondary)] mt-0.5 font-medium">
                    {mainCandidate.workspace.templateName} • ₱{mainCandidate.workspace.rateAmount}/hr
                  </p>
                  <div className="mt-3 rounded-xl bg-white border border-[var(--da-border-light)] p-3 text-xs flex flex-col gap-1">
                    <div className="flex justify-between">
                      <span className="text-[var(--da-text-secondary)]">Date:</span>
                      <span className="font-bold">{formatDateDisplay(mainCandidate.date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--da-text-secondary)]">Duration:</span>
                      <span className="font-bold">{mainCandidate.durationHours} hrs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--da-text-secondary)]">Time:</span>
                      <span className="font-bold">
                        {formatTime12Hour(mainCandidate.startTime)} – {formatTime12Hour(mainCandidate.endTime)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Backup 1 Card */}
                {backup1Candidate ? (
                  <div className="rounded-2xl border border-amber-300 bg-amber-50/40 p-5 relative shadow-sm">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="rounded-full bg-amber-500 text-white px-2.5 py-0.5 text-xs font-extrabold">
                        🥈 Backup 1
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCandidate(1)}
                        className="text-xs font-bold text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <h3 className="text-lg font-extrabold text-[var(--da-brand-dark)]">
                      {backup1Candidate.workspace.displayName}
                    </h3>
                    <p className="text-xs text-[var(--da-text-secondary)] mt-0.5 font-medium">
                      {backup1Candidate.workspace.templateName} • ₱{backup1Candidate.workspace.rateAmount}/hr
                    </p>
                    <div className="mt-3 rounded-xl bg-white border border-[var(--da-border-light)] p-3 text-xs flex flex-col gap-1">
                      <div className="flex justify-between">
                        <span className="text-[var(--da-text-secondary)]">Date:</span>
                        <span className="font-bold">{formatDateDisplay(backup1Candidate.date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--da-text-secondary)]">Duration:</span>
                        <span className="font-bold">{backup1Candidate.durationHours} hrs</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--da-text-secondary)]">Time:</span>
                        <span className="font-bold">
                          {formatTime12Hour(backup1Candidate.startTime)} – {formatTime12Hour(backup1Candidate.endTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl mb-2">🥈</span>
                    <h4 className="text-sm font-bold text-slate-700">Backup Spot 1 (Optional)</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Alternative spot of same type in case Main is taken.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleStartAddBackup(1)}
                      className="mt-4 rounded-full bg-[var(--da-primary)] text-white px-4 py-1.5 text-xs font-bold hover:opacity-90 transition shadow-sm"
                    >
                      + Add Backup 1
                    </button>
                  </div>
                )}

                {/* Backup 2 Card */}
                {backup2Candidate ? (
                  <div className="rounded-2xl border border-amber-300 bg-amber-50/40 p-5 relative shadow-sm">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="rounded-full bg-amber-600 text-white px-2.5 py-0.5 text-xs font-extrabold">
                        🥉 Backup 2
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCandidate(2)}
                        className="text-xs font-bold text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <h3 className="text-lg font-extrabold text-[var(--da-brand-dark)]">
                      {backup2Candidate.workspace.displayName}
                    </h3>
                    <p className="text-xs text-[var(--da-text-secondary)] mt-0.5 font-medium">
                      {backup2Candidate.workspace.templateName} • ₱{backup2Candidate.workspace.rateAmount}/hr
                    </p>
                    <div className="mt-3 rounded-xl bg-white border border-[var(--da-border-light)] p-3 text-xs flex flex-col gap-1">
                      <div className="flex justify-between">
                        <span className="text-[var(--da-text-secondary)]">Date:</span>
                        <span className="font-bold">{formatDateDisplay(backup2Candidate.date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--da-text-secondary)]">Duration:</span>
                        <span className="font-bold">{backup2Candidate.durationHours} hrs</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--da-text-secondary)]">Time:</span>
                        <span className="font-bold">
                          {formatTime12Hour(backup2Candidate.startTime)} – {formatTime12Hour(backup2Candidate.endTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : backup1Candidate ? (
                  <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl mb-2">🥉</span>
                    <h4 className="text-sm font-bold text-slate-700">Backup Spot 2 (Optional)</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Second fallback option for guaranteed allocation.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleStartAddBackup(2)}
                      className="mt-4 rounded-full bg-[var(--da-primary)] text-white px-4 py-1.5 text-xs font-bold hover:opacity-90 transition shadow-sm"
                    >
                      + Add Backup 2
                    </button>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 flex flex-col items-center justify-center text-center opacity-60">
                    <span className="text-2xl mb-2 text-slate-400">🥉</span>
                    <h4 className="text-xs font-bold text-slate-500">Backup Spot 2 (Optional)</h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Available after adding Backup 1.
                    </p>
                  </div>
                )}
              </div>

              {/* Explanatory Rule Callout */}
              <div className="mt-6 rounded-2xl bg-[var(--da-canvas)] border border-[var(--da-border-light)] p-4 text-xs text-[var(--da-text-secondary)] leading-relaxed">
                <div className="font-bold text-[var(--da-brand-dark)] mb-1 flex items-center gap-1.5">
                  <span>ℹ️</span> How Ranked Candidates Work
                </div>
                Guest bookings do not create holds prior to payment approval. During payment review, DeskAtlas automatically tries to allocate your <span className="font-bold text-[var(--da-brand-dark)]">Main spot first</span>. If another guest was confirmed for that spot just before you, DeskAtlas seamlessly falls back to <span className="font-bold text-[var(--da-brand-dark)]">Backup 1</span>, then <span className="font-bold text-[var(--da-brand-dark)]">Backup 2</span>. All backups maintain the identical template and duration so your total price remains exactly the same.
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--da-border-light)] pt-5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveRank(0);
                    setSelectedWorkspaceId(mainCandidate.workspace.workspaceInstanceId);
                    setStep("schedule");
                  }}
                  className="da-secondary-button text-xs font-bold"
                >
                  ← Edit Main Schedule
                </button>

                <div className="flex flex-wrap items-center gap-3">
                  {!backup1Candidate ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStartAddBackup(1)}
                        className="da-secondary-button text-xs font-bold px-4 py-2.5"
                      >
                        + Add Backup Spot 1 (Optional)
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep("summary")}
                        className="da-primary-button text-xs font-bold px-5 py-2.5"
                      >
                        Skip Backups & Proceed to Review →
                      </button>
                    </>
                  ) : !backup2Candidate ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStartAddBackup(2)}
                        className="da-secondary-button text-xs font-bold px-4 py-2.5"
                      >
                        + Add Backup Spot 2 (Optional)
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep("summary")}
                        className="da-primary-button text-xs font-bold px-5 py-2.5"
                      >
                        Finish Backups & Proceed to Review →
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setStep("summary")}
                      className="da-primary-button text-xs font-bold px-5 py-2.5"
                    >
                      Proceed to Review Summary →
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>
        ) : step === "summary" && mainCandidate ? (
          /* 3. Review Summary & Details Screen (MF-23) */
          <section className="flex flex-col gap-6">
            <div className="rounded-[28px] border border-[var(--da-border)] bg-white p-6 sm:p-8 shadow-[var(--da-shadow-lg)]">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[var(--da-border-light)] pb-4 mb-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--da-primary)]">
                    Step 3 of Reservation
                  </span>
                  <h2 className="text-2xl font-extrabold text-[var(--da-brand-dark)]">
                    Reservation Summary & Details
                  </h2>
                </div>
                <span className="rounded-full bg-[var(--da-info)] px-3.5 py-1 text-xs font-extrabold text-[var(--da-primary)]">
                  {candidates.length} {candidates.length === 1 ? "Ranked Spot" : "Ranked Spots"}
                </span>
              </div>

              {/* Candidate Cards List with Workspace Preview Images */}
              <div className="flex flex-col gap-4">
                {candidates.map((cand) => {
                  const isMain = cand.rank === 0;
                  const hasCustomPhoto = Boolean(
                    cand.workspace.photoPath && !candidateImageErrors[cand.workspace.workspaceInstanceId]
                  );

                  return (
                    <div
                      key={cand.workspace.workspaceInstanceId}
                      className={`rounded-2xl border p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition ${
                        isMain
                          ? "border-[var(--da-primary)] bg-[var(--da-canvas)] shadow-sm"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
                        {/* Preview Image / Fallback */}
                        <div className="relative aspect-[16/10] w-full sm:w-44 sm:h-28 shrink-0 overflow-hidden rounded-xl border border-[var(--da-border-light)] bg-slate-100 shadow-sm">
                          {hasCustomPhoto ? (
                            <img
                              src={cand.workspace.photoPath!}
                              alt={cand.workspace.displayName}
                              onError={() =>
                                setCandidateImageErrors((prev) => ({
                                  ...prev,
                                  [cand.workspace.workspaceInstanceId]: true,
                                }))
                              }
                              className="h-full w-full object-cover"
                              style={{
                                objectPosition: getWorkspacePhotoObjectPosition(cand.workspace.photoPosition),
                              }}
                            />
                          ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-[#E0EFE4]/60 to-[#F3F7F4]">
                              <span className="text-2xl">🏢</span>
                              <span className="mt-1 text-[11px] font-bold text-[var(--da-brand-dark)] line-clamp-1">
                                {cand.workspace.templateName}
                              </span>
                              <span className="text-[9px] text-[var(--da-text-secondary)] font-medium">
                                DeskAtlas Space
                              </span>
                            </div>
                          )}
                          <div className="absolute top-2 left-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold shadow-sm ${
                                isMain
                                  ? "bg-[var(--da-primary)] text-white"
                                  : cand.rank === 1
                                  ? "bg-amber-500 text-white"
                                  : "bg-amber-600 text-white"
                              }`}
                            >
                              {isMain ? "👑 Main" : cand.rank === 1 ? "🥈 Backup 1" : "🥉 Backup 2"}
                            </span>
                          </div>
                        </div>

                        {/* Candidate Information */}
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider ${
                                isMain
                                  ? "bg-[var(--da-primary)] text-white"
                                  : "bg-amber-100 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {isMain
                                ? "Main Choice"
                                : `Backup ${cand.rank}`}
                            </span>
                            <span className="text-xs font-semibold text-[var(--da-text-secondary)]">
                              {cand.workspace.floorName}
                            </span>
                          </div>

                          <h3 className="mt-1 text-lg font-extrabold text-[var(--da-brand-dark)]">
                            {cand.workspace.displayName}
                          </h3>
                          <p className="text-xs text-[var(--da-text-secondary)]">
                            {cand.workspace.templateName} •{" "}
                            <span className="font-bold text-[var(--da-brand-dark)]">
                              ₱{cand.workspace.rateAmount.toFixed(2)}/hr
                            </span>
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--da-text-secondary)]">
                            <span className="font-bold text-[var(--da-brand-dark)]">
                              📅 {formatDateDisplay(cand.date)}
                            </span>
                            <span>•</span>
                            <span className="font-medium">
                              🕒 {formatTime12Hour(cand.startTime)} – {formatTime12Hour(cand.endTime)} ({cand.durationHours} hr{cand.durationHours > 1 ? "s" : ""})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Pricing and Actions on right side */}
                      <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 border-t md:border-t-0 border-[var(--da-border-light)] pt-3 md:pt-0">
                        <div className="text-left md:text-right">
                          <span className="text-[11px] font-bold text-[var(--da-text-secondary)] block">
                            Candidate Total:
                          </span>
                          <span className="text-base font-extrabold text-[var(--da-brand-dark)]">
                            ₱{(cand.workspace.rateAmount * cand.durationHours).toFixed(2)}
                          </span>
                        </div>

                        {!isMain ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveCandidate(cand.rank as 1 | 2)}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700 hover:bg-red-100 transition"
                          >
                            Remove Backup
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add More Backups button if less than 3 */}
              {candidates.length < 3 ? (
                <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 border border-dashed border-slate-200 p-4">
                  <div className="text-xs text-slate-600">
                    <span className="font-bold">Want to add another fallback spot?</span> You can select up to 2 backups.
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStartAddBackup(candidates.length === 1 ? 1 : 2)}
                    className="da-secondary-button text-xs font-bold py-1.5 px-3"
                  >
                    + Add Backup {candidates.length === 1 ? "1" : "2"}
                  </button>
                </div>
              ) : null}

              {/* Pricing & Atomic Allocation Summary */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-[var(--da-canvas)] border border-[var(--da-border-light)] p-4 text-xs text-[var(--da-text-secondary)] flex flex-col justify-between gap-3">
                  <div>
                    <div className="font-bold text-[var(--da-brand-dark)] mb-1">
                      🔒 No-Hold & Atomic Allocation Guarantee
                    </div>
                    <p className="leading-5">
                      Your rate of ₱{mainCandidate.workspace.rateAmount.toFixed(2)}/hr for {mainCandidate.durationHours} hours is locked. No upfront payment is charged right now. When proof is approved by admin, the first available candidate (Main → Backup 1 → Backup 2) will be permanently allocated.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full w-fit">
                    ✓ All {candidates.length} candidates use equal rates & duration
                  </span>
                </div>

                <div className="rounded-2xl bg-[var(--da-canvas)] border border-[var(--da-border-light)] p-4 flex flex-col justify-between gap-3 text-xs">
                  <div className="flex flex-col gap-2 text-[var(--da-text-secondary)]">
                    <div className="flex justify-between">
                      <span>Rate per Hour:</span>
                      <span className="font-bold text-[var(--da-brand-dark)]">
                        ₱{mainCandidate.workspace.rateAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-bold text-[var(--da-brand-dark)]">
                        {mainCandidate.durationHours} Hours
                      </span>
                    </div>
                    <div className="border-t border-[var(--da-border-light)] pt-2 flex justify-between items-center">
                      <span className="font-extrabold text-sm text-[var(--da-brand-dark)]">
                        Amount Due on Confirmation:
                      </span>
                      <span className="font-extrabold text-lg text-[var(--da-primary)]">
                        ₱{(mainCandidate.workspace.rateAmount * mainCandidate.durationHours).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-[var(--da-text-secondary)] italic text-right">
                    * Guest reservation created with no upfront hold
                  </div>
                </div>
              </div>

              {/* Customer Details Form at the Bottom (MF-23) */}
              <div className="mt-8 border-t border-[var(--da-border-light)] pt-6">
                <div className="mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--da-primary)]">
                    Final Step • Guest Customer Information
                  </span>
                  <h3 className="text-xl font-extrabold text-[var(--da-brand-dark)]">
                    Customer Details
                  </h3>
                  <p className="mt-1 text-xs text-[var(--da-text-secondary)]">
                    Please provide your contact information to receive your reservation tracking and payment link. DeskAtlas is guest-first — no password, membership, or account registration required.
                  </p>
                </div>

                {submitErrorMessage ? (
                  <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 flex items-center gap-2 shadow-sm">
                    <span>⚠️</span>
                    <span>{submitErrorMessage}</span>
                  </div>
                ) : null}

                <form onSubmit={handleSubmitReservation} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* First Name */}
                    <div>
                      <label htmlFor="customer-first-name" className="block text-xs font-bold text-[var(--da-brand-dark)] mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="customer-first-name"
                        type="text"
                        value={customerFirstName}
                        onChange={(e) => {
                          setCustomerFirstName(e.target.value);
                          if (formErrors.firstName) {
                            setFormErrors((prev) => ({ ...prev, firstName: undefined }));
                          }
                        }}
                        placeholder="e.g. Maria"
                        disabled={isSubmitting}
                        className={`da-input w-full text-sm font-medium ${
                          formErrors.firstName ? "border-red-500 focus:border-red-500 ring-red-200" : ""
                        }`}
                      />
                      {formErrors.firstName ? (
                        <p className="mt-1 text-[11px] font-bold text-red-600">
                          {formErrors.firstName}
                        </p>
                      ) : null}
                    </div>

                    {/* Last Name */}
                    <div>
                      <label htmlFor="customer-last-name" className="block text-xs font-bold text-[var(--da-brand-dark)] mb-1">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="customer-last-name"
                        type="text"
                        value={customerLastName}
                        onChange={(e) => {
                          setCustomerLastName(e.target.value);
                          if (formErrors.lastName) {
                            setFormErrors((prev) => ({ ...prev, lastName: undefined }));
                          }
                        }}
                        placeholder="e.g. Santos"
                        disabled={isSubmitting}
                        className={`da-input w-full text-sm font-medium ${
                          formErrors.lastName ? "border-red-500 focus:border-red-500 ring-red-200" : ""
                        }`}
                      />
                      {formErrors.lastName ? (
                        <p className="mt-1 text-[11px] font-bold text-red-600">
                          {formErrors.lastName}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="customer-email" className="block text-xs font-bold text-[var(--da-brand-dark)] mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="customer-email"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => {
                        setCustomerEmail(e.target.value);
                        if (formErrors.email) {
                          setFormErrors((prev) => ({ ...prev, email: undefined }));
                        }
                      }}
                      placeholder="e.g. maria.santos@example.com"
                      disabled={isSubmitting}
                      className={`da-input w-full text-sm font-medium ${
                        formErrors.email ? "border-red-500 focus:border-red-500 ring-red-200" : ""
                      }`}
                    />
                    {formErrors.email ? (
                      <p className="mt-1 text-[11px] font-bold text-red-600">
                        {formErrors.email}
                      </p>
                    ) : (
                      <p className="mt-1 text-[11px] text-[var(--da-text-secondary)]">
                        Your payment session and booking access pass will be sent to this email address.
                      </p>
                    )}
                  </div>

                  {/* Notice */}
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-[11px] leading-relaxed text-slate-600">
                    <span className="font-bold text-slate-800">Please Note:</span> Submitting creates a pending reservation and opens a 1-hour online payment session. The selected workspace is not guaranteed until payment proof is approved and the reservation is confirmed.
                  </div>

                  {/* Form Action Buttons */}
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--da-border-light)] pt-5">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setStep("backup-prompt")}
                      className="da-secondary-button text-xs font-bold"
                    >
                      ← Back to Backup Management
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="da-primary-button text-sm font-extrabold px-6 py-3 min-w-[240px] flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Submitting Reservation...</span>
                        </>
                      ) : (
                        <span>
                          Submit Reservation & Pay (₱
                          {(mainCandidate.workspace.rateAmount * mainCandidate.durationHours).toFixed(2)}) →
                        </span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>
        ) : (
          /* 4. Map Selection View (For Main or Backup) */
          <>
            {/* Template Mismatch or Guidance Alert */}
            {templateMismatchWarning ? (
              <div className="rounded-[22px] border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-base">⚠️</span>
                  <div>
                    <span className="font-bold">Template Constraint: </span>
                    {templateMismatchWarning}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTemplateMismatchWarning(null)}
                  className="da-inline-button font-bold text-amber-900"
                >
                  Dismiss
                </button>
              </div>
            ) : activeRank > 0 && mainCandidate ? (
              <div className="rounded-[22px] border border-[var(--da-primary)] bg-[var(--da-canvas)] p-4 text-xs text-[var(--da-brand-dark)] flex flex-wrap items-center justify-between gap-3 shadow-sm">
                <div>
                  <span className="font-extrabold uppercase tracking-wider text-[var(--da-primary)]">
                    Selecting Backup Spot {activeRank} (Optional):
                  </span>{" "}
                  Please choose another <span className="font-bold">{mainCandidate.workspace.templateName}</span> spot on the map. Date ({formatDateDisplay(mainCandidate.date)}) and duration ({mainCandidate.durationHours} hrs) will be matched to Main.
                </div>
                <button
                  type="button"
                  onClick={() => setStep("backup-prompt")}
                  className="da-secondary-button text-xs font-bold py-1.5 px-3"
                >
                  Cancel Backup Selection
                </button>
              </div>
            ) : null}

            {/* Error Alert */}
            {mapError ? (
              <div className="rounded-[22px] border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-red-900">Published map unavailable</div>
                  <p className="mt-1">{mapError}</p>
                </div>
                <button type="button" className="da-inline-button" onClick={refetch}>
                  Retry map
                </button>
              </div>
            ) : null}

            {/* Workspace Map Card */}
            <section className="w-full rounded-[28px] border border-[var(--da-border)] bg-white p-4 sm:p-6 shadow-[var(--da-shadow-lg)]">
              {/* Controls Bar */}
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--da-border-light)] pb-4">
                {/* Floor Selector */}
                <div className="flex flex-wrap items-center gap-3">
                  <label htmlFor="floor-select" className="text-sm font-bold text-[var(--da-text-primary)]">
                    Floor:
                  </label>
                  {floors.length > 0 ? (
                    <select
                      id="floor-select"
                      value={floorId}
                      onChange={(e) => handleFloorChange(e.target.value)}
                      className="da-input max-w-xs text-sm font-semibold py-2"
                    >
                      {floors.map((floor) => (
                        <option key={floor.id} value={floor.id}>
                          {floor.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-sm text-[var(--da-text-secondary)]">
                      {mapLoading ? "Loading floors..." : "No published floors"}
                    </span>
                  )}
                </div>

                {/* Map Controls & Status Legend */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Status Legend */}
                  <div className="hidden sm:flex items-center gap-3 text-xs font-semibold text-[var(--da-text-secondary)] border-r border-[var(--da-border-light)] pr-3">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-3 w-3 rounded bg-[#E0EFE4] border border-[#22c55e]" /> Available
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-3 w-3 rounded bg-[#FCF060] border border-[#f59e0b]" /> Maintenance
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-3 w-3 rounded bg-[#F3F7F4] border border-[#94a3b8]" /> Unavailable
                    </span>
                  </div>

                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleZoomOut}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--da-border)] bg-white text-base font-bold text-[var(--da-text-primary)] hover:bg-slate-50 transition"
                      aria-label="Zoom out"
                    >
                      −
                    </button>
                    <span className="w-12 text-center text-xs font-bold text-[var(--da-text-secondary)]">
                      {Math.round(zoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={handleZoomIn}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--da-border)] bg-white text-base font-bold text-[var(--da-text-primary)] hover:bg-slate-50 transition"
                      aria-label="Zoom in"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={handleFitView}
                      className="rounded-xl border border-[var(--da-border)] bg-white px-3 py-2 text-xs font-bold text-[var(--da-brand-dark)] hover:bg-slate-50 transition"
                    >
                      Fit View
                    </button>
                  </div>
                </div>
              </div>

              {/* Map Viewport Area */}
              <div
                ref={mapContainerRef}
                className="relative w-full rounded-none border border-[var(--da-border-light)] bg-white overflow-auto min-h-[500px] sm:min-h-[580px] max-h-[75vh]"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "flex-start",
                  position: "relative",
                  padding: 0,
                }}
              >
                {mapLoading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center bg-white z-10">
                    <div className="h-8 w-8 animate-spin rounded-full border-3 border-[var(--da-primary)] border-t-transparent" />
                    <p className="text-sm font-semibold text-[var(--da-text-secondary)]">
                      Loading published floor map...
                    </p>
                  </div>
                ) : !published || elements.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white z-10">
                    <div className="rounded-2xl border border-[var(--da-border)] bg-white p-8 max-w-md shadow-[var(--da-shadow-md)]">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--da-info)] text-2xl">
                        🗺️
                      </div>
                      <h2 className="mt-4 text-lg font-extrabold text-[var(--da-brand-dark)]">
                        No workspaces published on this floor
                      </h2>
                      <p className="mt-2 text-xs leading-5 text-[var(--da-text-secondary)]">
                        Please select another floor or check back once the layout is published.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      width: `${canvasDimensions.width * zoom}px`,
                      height: `${canvasDimensions.height * zoom}px`,
                      minWidth: "100%",
                      minHeight: "100%",
                      position: "relative",
                      flexShrink: 0,
                      background: "#fff",
                    }}
                  >
                    <div
                      ref={canvasRef}
                      style={{
                        width: `${canvasDimensions.width}px`,
                        height: `${canvasDimensions.height}px`,
                        position: "absolute",
                        top: 0,
                        left: 0,
                        background: "#fff",
                        borderRadius: "0px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                        transform: `scale(${zoom})`,
                        transformOrigin: "top left",
                        backgroundImage: "radial-gradient(var(--da-border) 1px, transparent 1px)",
                        backgroundSize: `${canvasDimensions.gridSize}px ${canvasDimensions.gridSize}px`,
                        overflow: "hidden",
                      }}
                    >
                      {elements.map((el: PublishedMapElement) => {
                        const isWorkspace = el.elementRole === "WORKSPACE" || Boolean(el.workspace);
                        const isWall =
                          el.elementRole === "STRUCTURE" ||
                          el.elementType?.toLowerCase().includes("wall") ||
                          el.elementType?.toLowerCase().includes("thin") ||
                          el.elementType?.toLowerCase().includes("glass") ||
                          el.elementType?.toLowerCase().includes("separator");

                        const isRestroom =
                          el.elementType?.toLowerCase().includes("restroom") ||
                          el.label?.toLowerCase().includes("restroom");
                        const isPantry =
                          el.elementType?.toLowerCase().includes("pantry") ||
                          el.label?.toLowerCase().includes("pantry");
                        const isEmergencyExit =
                          el.elementType?.toLowerCase().includes("exit") ||
                          el.elementType?.toLowerCase().includes("emergency") ||
                          el.label?.toLowerCase().includes("exit") ||
                          el.label?.toLowerCase().includes("emergency");
                        const isAmenity =
                          el.elementRole === "AMENITY" || isRestroom || isPantry || isEmergencyExit;
                        const isKioskMarker =
                          el.elementType === "KIOSK_YOU_ARE_HERE" ||
                          (el.style as any)?.markerType === "KIOSK_YOU_ARE_HERE" ||
                          el.label?.toLowerCase() === "you are here" ||
                          el.label?.toLowerCase().includes("kiosk");

                        if (isKioskMarker) {
                          return (
                            <div
                              key={el.id}
                              style={{
                                position: "absolute",
                                left: el.x,
                                top: el.y,
                                width: el.width,
                                height: el.height,
                                transform: `rotate(${el.rotation || 0}deg)`,
                                zIndex: el.zIndex || 20,
                                pointerEvents: "none",
                              }}
                            >
                              <div
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "2px",
                                  background: "#DC2626",
                                  color: "#ffffff",
                                  borderRadius: "14px",
                                  border: "2px solid #ffffff",
                                  boxShadow: "0 4px 12px rgba(220, 38, 38, 0.35)",
                                  padding: "4px",
                                  textAlign: "center",
                                }}
                              >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="You Are Here">
                                  <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" fill="#ffffff" stroke="#DC2626" strokeWidth="1.5" />
                                  <circle cx="12" cy="10" r="3" fill="#DC2626" />
                                </svg>
                                <span style={{ fontSize: "10px", fontWeight: 800, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#ffffff", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
                                  {el.label || "You Are Here"}
                                </span>
                              </div>
                            </div>
                          );
                        }

                        let defaultAmenityColor = "#F3F7F4";
                        if (isRestroom) defaultAmenityColor = "#E0F2FE";
                        else if (isPantry) defaultAmenityColor = "#FEF3C7";
                        else if (isEmergencyExit) defaultAmenityColor = "#DCFCE7";

                        const displayName =
                          el.workspace?.displayName ||
                          el.label ||
                          el.workspace?.templateName ||
                          el.elementType;
                        const itemColor =
                          el.style?.color ||
                          (el.style as any)?.fillColor ||
                          (isWorkspace
                            ? "#E0EFE4"
                            : isAmenity
                              ? defaultAmenityColor
                              : isWall
                                ? "#334155"
                                : "#F3F7F4");

                        let bg = String(itemColor);
                        let textColor = getContrastColor(bg);

                        if (isWorkspace) {
                          const isSelected =
                            el.workspace?.workspaceInstanceId === selectedWorkspaceId;
                          const status = el.workspace?.operationalStatus || "ACTIVE";
                          const isBookable = el.workspace?.isBookable ?? true;
                          const isAvailable = isBookable && status === "ACTIVE";
                          const isMatchingTemplate =
                            !mainCandidate ||
                            el.workspace?.templateId === mainCandidate.workspace.templateId;

                          let borderColor = isSelected ? "var(--da-accent)" : "#DCE6DF";
                          let borderWidth = isSelected ? "3px" : "1.5px";
                          let borderStyle = "solid";

                          if (status === "MAINTENANCE") {
                            borderStyle = "dashed";
                            borderColor = "#f59e0b";
                            bg = "#FCF060";
                            textColor = "#92400e";
                          } else if (!isAvailable) {
                            borderStyle = "dashed";
                            borderColor = "#94a3b8";
                            bg = "#F3F7F4";
                            textColor = "#64748b";
                          } else if (activeRank > 0 && !isMatchingTemplate) {
                            // Dimmed for non-matching template choices
                            borderStyle = "dashed";
                            borderColor = "#cbd5e1";
                            bg = "#f8fafc";
                            textColor = "#94a3b8";
                          }

                          return (
                            <div
                              key={el.id}
                              style={{
                                position: "absolute",
                                left: el.x,
                                top: el.y,
                                width: el.width,
                                height: el.height,
                                transform: `rotate(${el.rotation || 0}deg)`,
                                zIndex: isSelected ? 30 : el.zIndex || 10,
                              }}
                            >
                              <button
                                type="button"
                                aria-label={`${displayName} ${isAvailable ? "Available" : "Unavailable"}`}
                                disabled={!isAvailable}
                                onClick={() => {
                                  if (el.workspace) {
                                    const card = workspaces.find(
                                      (w) => w.workspaceInstanceId === el.workspace?.workspaceInstanceId
                                    );
                                    if (!card) return;

                                    if (activeRank > 0 && mainCandidate) {
                                      if (card.templateId !== mainCandidate.workspace.templateId) {
                                        setTemplateMismatchWarning(
                                          `Backups must use the same workspace template/tier as your Main selection (${mainCandidate.workspace.templateName}). You clicked "${card.templateName}".`
                                        );
                                        return;
                                      }
                                    }

                                    setTemplateMismatchWarning(null);
                                    setModalWorkspace(card);
                                    setIsModalOpen(true);
                                  }
                                }}
                                className="group relative flex h-full w-full flex-col items-center justify-center p-1 text-center transition-all duration-150"
                                style={{
                                  backgroundColor: bg,
                                  borderWidth,
                                  borderStyle,
                                  borderColor,
                                  borderRadius: el.elementType === "meeting-room" ? "16px" : "10px",
                                  color: textColor,
                                  cursor: isAvailable ? "pointer" : "not-allowed",
                                  opacity: isAvailable ? (activeRank > 0 && !isMatchingTemplate ? 0.6 : 1) : 0.75,
                                  boxShadow: isSelected
                                    ? "0 0 0 4px rgba(200, 244, 81, 0.4), 0 4px 12px rgba(12, 59, 39, 0.15)"
                                    : "0 1px 3px rgba(0, 0, 0, 0.05)",
                                }}
                              >
                                <span className="max-w-full truncate text-[11px] font-bold leading-tight">
                                  {displayName}
                                </span>
                              </button>
                            </div>
                          );
                        }

                        if (isWall) {
                          return (
                            <div
                              key={el.id}
                              style={{
                                position: "absolute",
                                left: el.x,
                                top: el.y,
                                width: el.width,
                                height: el.height,
                                transform: `rotate(${el.rotation || 0}deg)`,
                                zIndex: el.zIndex || 1,
                                backgroundColor: bg,
                                borderRadius: "2px",
                                pointerEvents: "none",
                              }}
                            />
                          );
                        }

                        if (isAmenity) {
                          return (
                            <div
                              key={el.id}
                              style={{
                                position: "absolute",
                                left: el.x,
                                top: el.y,
                                width: el.width,
                                height: el.height,
                                transform: `rotate(${el.rotation || 0}deg)`,
                                zIndex: el.zIndex || 2,
                                backgroundColor: bg,
                                borderRadius: "8px",
                                border: "1px solid rgba(0, 0, 0, 0.1)",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                textAlign: "center",
                                padding: "4px",
                                pointerEvents: "none",
                                color: textColor,
                              }}
                            >
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "3px", maxWidth: "100%", maxHeight: "100%", textAlign: "center" }}>
                                <AmenityIcon type={el.elementType} name={displayName} color={textColor} />
                                <span style={{ fontSize: "10px", fontWeight: 700, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: 0.9, textAlign: "center" }}>
                                  {displayName}
                                </span>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={el.id}
                            style={{
                              position: "absolute",
                              left: el.x,
                              top: el.y,
                              width: el.width,
                              height: el.height,
                              transform: `rotate(${el.rotation || 0}deg)`,
                              zIndex: el.zIndex || 1,
                              backgroundColor: bg,
                              borderRadius: "6px",
                              pointerEvents: "none",
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Workspace Indicator / Map Legend Footer */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--da-text-secondary)]">
                <p className="font-medium">
                  {activeRank > 0 && mainCandidate
                    ? `Showing ${mainCandidate.workspace.templateName} spots for Backup ${activeRank}. Click an available spot to proceed.`
                    : "Click an available workspace to select it. (Guest reservations do not hold inventory until approved and allocated)."}
                </p>
                {selectedWorkspace ? (
                  <div className="flex flex-wrap items-center gap-2 rounded-full bg-[var(--da-canvas)] border border-[var(--da-border-light)] px-3.5 py-1.5">
                    <span className="h-2 w-2 rounded-full bg-[var(--da-primary)]" />
                    <span className="font-bold text-[var(--da-brand-dark)]">
                      Selected: {selectedWorkspace.displayName}
                    </span>
                    <span className="text-[var(--da-text-secondary)]">• {selectedWorkspace.pricingLabel}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setModalWorkspace(selectedWorkspace);
                        setIsModalOpen(true);
                      }}
                      className="ml-1 font-bold text-[var(--da-primary)] hover:underline"
                    >
                      View Details
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("schedule");
                      }}
                      className="ml-2 rounded-full bg-[var(--da-primary)] text-white px-3 py-1 text-xs font-bold hover:opacity-90 transition"
                    >
                      Proceed to Schedule →
                    </button>
                  </div>
                ) : null}
              </div>
            </section>
          </>
        )}
      </div>

      {/* Spot Detail Modal */}
      <SpotDetailModal
        workspace={modalWorkspace}
        open={isModalOpen}
        candidateRank={activeRank}
        mainTemplateName={mainCandidate?.workspace.templateName}
        onOpenChange={setIsModalOpen}
        onProceed={(ws) => {
          setSelectedWorkspaceId(ws.workspaceInstanceId);
          setModalWorkspace(ws);
          setIsModalOpen(false);
          setStep("schedule");
        }}
      />

      {/* Email Confirmation Modal (MF-35) */}
      {mainCandidate ? (
        <EmailConfirmationModal
          open={isEmailConfirmOpen}
          onOpenChange={setIsEmailConfirmOpen}
          email={customerEmail.trim()}
          customerName={`${customerFirstName.trim()} ${customerLastName.trim()}`}
          mainSpotName={mainCandidate.workspace.displayName}
          templateName={mainCandidate.workspace.templateName}
          durationHours={mainCandidate.durationHours}
          date={mainCandidate.date}
          totalAmount={mainCandidate.workspace.rateAmount * mainCandidate.durationHours}
          isSubmitting={isSubmitting}
          onConfirm={handleConfirmSubmit}
        />
      ) : null}
    </main>
  );
}
