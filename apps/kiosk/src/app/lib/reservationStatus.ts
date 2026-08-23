/**
 * Canonical reservation & payment-review status model.
 *
 * Source of truth: DeskAtlas Feature Scope and UCD Review, Section 9
 * ("Simplified Status Model") and the DeskAtlas System Architecture
 * Guideline, Section 5 ("Core Data Model").
 *
 * IMPORTANT: This file must stay identical across all four apps
 * (Customer Website, User Kiosk, Staff Dashboard, Admin Portal) until
 * they are consolidated into a real `packages/domain` shared package,
 * per Architecture Guideline Section 3. Do not add, rename, or remove
 * statuses locally — the review explicitly warns that divergent status
 * labels across interfaces cause confusion and support burden
 * (Section 6, "Reservation statuses: Simplify").
 */

export const RESERVATION_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  PAYMENT_UNDER_REVIEW: 'payment_under_review',
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checked_in',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
} as const;

export type ReservationStatus =
  (typeof RESERVATION_STATUS)[keyof typeof RESERVATION_STATUS];

export const RESERVATION_STATUS_LABEL: Record<ReservationStatus, string> = {
  [RESERVATION_STATUS.PENDING_PAYMENT]: 'Pending Payment',
  [RESERVATION_STATUS.PAYMENT_UNDER_REVIEW]: 'Payment Under Review',
  [RESERVATION_STATUS.CONFIRMED]: 'Confirmed',
  [RESERVATION_STATUS.CHECKED_IN]: 'Checked In',
  [RESERVATION_STATUS.COMPLETED]: 'Completed',
  [RESERVATION_STATUS.CANCELLED]: 'Cancelled',
  [RESERVATION_STATUS.EXPIRED]: 'Expired',
};

// Tailwind badge classes kept alongside the label so every screen renders
// the same status the same way (review Appendix B: "Are the reservation
// and payment statuses consistent across screens and emails?").
export const RESERVATION_STATUS_BADGE: Record<ReservationStatus, string> = {
  [RESERVATION_STATUS.PENDING_PAYMENT]: 'bg-amber-100 text-amber-800',
  [RESERVATION_STATUS.PAYMENT_UNDER_REVIEW]: 'bg-blue-100 text-blue-800',
  [RESERVATION_STATUS.CONFIRMED]: 'bg-[#b2dfdb] text-[#00796b]',
  [RESERVATION_STATUS.CHECKED_IN]: 'bg-green-100 text-green-800',
  [RESERVATION_STATUS.COMPLETED]: 'bg-gray-100 text-gray-700',
  [RESERVATION_STATUS.CANCELLED]: 'bg-red-100 text-red-700',
  [RESERVATION_STATUS.EXPIRED]: 'bg-orange-100 text-orange-800',
};

/**
 * Payment-proof review sub-status. Kept separate from reservation status
 * per Architecture Guideline Section 5: "Payment review sub-status:
 * pending_review | approved | rejected".
 */
export const PAYMENT_REVIEW_STATUS = {
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type PaymentReviewStatus =
  (typeof PAYMENT_REVIEW_STATUS)[keyof typeof PAYMENT_REVIEW_STATUS];

export const PAYMENT_REVIEW_STATUS_LABEL: Record<PaymentReviewStatus, string> = {
  [PAYMENT_REVIEW_STATUS.PENDING_REVIEW]: 'Pending Review',
  [PAYMENT_REVIEW_STATUS.APPROVED]: 'Approved',
  [PAYMENT_REVIEW_STATUS.REJECTED]: 'Rejected',
};
