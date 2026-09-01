"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";

interface EmailConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  customerName: string;
  mainSpotName: string;
  templateName: string;
  durationHours: number;
  date: string;
  totalAmount: number;
  isSubmitting: boolean;
  onConfirm: () => void;
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

export function EmailConfirmationModal({
  open,
  onOpenChange,
  email,
  customerName,
  mainSpotName,
  templateName,
  durationHours,
  date,
  totalAmount,
  isSubmitting,
  onConfirm,
}: EmailConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={isSubmitting ? () => {} : onOpenChange}>
      <DialogContent
        className="max-w-lg sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-[24px] border border-[var(--da-border)] bg-white p-6 sm:p-7 shadow-2xl"
        aria-describedby="email-confirm-description"
      >
        <DialogHeader className="flex flex-col items-center text-center pb-2">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--da-canvas)] border border-[var(--da-primary)] text-2xl shadow-sm">
            ✉️
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-extrabold text-[var(--da-brand-dark)]">
            Confirm Your Email Address
          </DialogTitle>
          <DialogDescription id="email-confirm-description" className="text-xs sm:text-sm text-[var(--da-text-secondary)] mt-1 max-w-md">
            Please ensure this email is accurate. Your verified booking QR access pass will be dispatched directly to this email upon payment confirmation.
          </DialogDescription>
        </DialogHeader>

        {/* Email Recipient Card */}
        <div className="mt-2 rounded-2xl border-2 border-[var(--da-primary)] bg-[var(--da-canvas)] p-4 sm:p-5 text-center shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--da-primary)] block mb-1">
            Booking Pass Recipient
          </span>
          <p className="text-lg sm:text-xl font-extrabold text-[var(--da-brand-dark)] break-all select-all">
            {email}
          </p>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5">
            ✓ Double-check for typos or missing letters
          </span>
        </div>

        {/* Reservation Quick Info */}
        <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-700 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Guest Name:</span>
            <span className="font-bold text-[var(--da-brand-dark)]">{customerName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Main Workspace:</span>
            <span className="font-bold text-[var(--da-brand-dark)]">
              {mainSpotName} ({templateName})
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Schedule:</span>
            <span className="font-bold text-[var(--da-brand-dark)]">
              {formatDateDisplay(date)} • {durationHours} hr{durationHours > 1 ? "s" : ""}
            </span>
          </div>
          <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
            <span className="font-bold text-slate-800">Amount Due:</span>
            <span className="font-extrabold text-sm text-[var(--da-primary)]">
              ₱{totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Important Guidance Box */}
        <div className="mt-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-900 leading-relaxed space-y-1">
          <div className="font-bold flex items-center gap-1">
            <span>⚡</span> Walk-In Counter Confirmation
          </div>
          <p>
            Submitting will generate your check-in reference code. Present this code to staff at the counter to confirm payment and receive your booking pass.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
            className="da-secondary-button w-full sm:w-auto text-xs font-bold py-2.5 px-4"
          >
            ← Edit Email
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className="da-primary-button w-full sm:w-auto text-xs font-extrabold py-2.5 px-6 flex items-center justify-center gap-2 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Generating Check-In Code...</span>
              </>
            ) : (
              <span>Confirm & Get Code →</span>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
