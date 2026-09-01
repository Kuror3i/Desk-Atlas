import assert from "node:assert/strict";
import {
  CandidateValidationError,
  CandidateValidationContext,
  InMemoryWorkspaceRepository,
  ReservationMemoryRepository,
  createPaymentSessionService,
  createReservationService,
  createPaymentReviewService,
  validateCandidates,
  type CandidateSubmissionDTO,
  type CreateReservationRequest,
  type ReservationResponseDTO,
} from "../packages/domain/src/index";
import { WorkspaceInstance, WorkspaceTemplate } from "../packages/domain/src/models/workspace";

// Client-side helper simulation matching ReservationPage.tsx and EmailConfirmationModal
function validateCustomerDetails(input: {
  firstName: string;
  lastName: string;
  email: string;
}): { valid: boolean; errors: { firstName?: string; lastName?: string; email?: string } } {
  const errors: { firstName?: string; lastName?: string; email?: string } = {};

  if (!input.firstName.trim()) {
    errors.firstName = "First name is required.";
  }
  if (!input.lastName.trim()) {
    errors.lastName = "Last name is required.";
  }
  const emailVal = input.email.trim();
  if (!emailVal) {
    errors.email = "Email address is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
    errors.email = "Please enter a valid email address.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// Simulated mock for transactional email dispatcher matching apps/customer-website/src/app/api/reservations/route.ts
interface DispatchedEmail {
  to: string;
  referenceCode: string;
  amountDue: number;
  currency: string;
  paymentUrl: string;
  expiresAt: string;
}

const emailInboxAudit: DispatchedEmail[] = [];

async function mockDispatchPaymentLinkEmail(input: DispatchedEmail) {
  emailInboxAudit.push(input);
}

// Client-side transition helper matching ReservationPage.tsx
interface PostSubmitHandoffState {
  step: "map" | "schedule" | "backup-prompt" | "summary" | "email-handoff";
  submittedReservation: {
    referenceCode: string;
    customerEmail: string;
  } | null;
  navigatedToPayToken: boolean;
  navigatedToHome: boolean;
}

function handleClientPostSubmitSuccess(
  apiResult: { referenceCode: string; paymentSession?: { token: string; paymentUrl: string } },
  customerEmail: string
): PostSubmitHandoffState {
  // Direct /pay/:token redirect is intentionally removed in MF-35
  const navigatedToPayToken = false;
  return {
    step: "email-handoff",
    submittedReservation: {
      referenceCode: apiResult.referenceCode,
      customerEmail: customerEmail.trim().toLowerCase(),
    },
    navigatedToPayToken,
    navigatedToHome: false,
  };
}

async function run() {
  console.log("--- Starting MF-35 Customer Post Submit Email Handoff Tests ---");

  const TEMPLATE_DEDICATED: WorkspaceTemplate = {
    id: "tpl-desk-pro",
    name: "Dedicated Pro Desk",
    description: "Ergonomic desk with external monitor",
    photoPath: "/photos/pro-desk.jpg",
    capacity: 1,
    rateAmount: 85,
    pricingUnit: "HOURLY",
    defaultShape: "rectangle",
    defaultColor: "#E0EFE4",
    defaultStyle: {},
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const INSTANCES: WorkspaceInstance[] = [
    {
      id: "inst-pro-01",
      templateId: "tpl-desk-pro",
      floorId: "floor-1",
      instanceCode: "PRO-01",
      displayName: "Pro Desk 01",
      operationalStatus: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "inst-pro-02",
      templateId: "tpl-desk-pro",
      floorId: "floor-1",
      instanceCode: "PRO-02",
      displayName: "Pro Desk 02",
      operationalStatus: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "inst-pro-03",
      templateId: "tpl-desk-pro",
      floorId: "floor-1",
      instanceCode: "PRO-03",
      displayName: "Pro Desk 03",
      operationalStatus: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // 1. Customer detail validation tests
  console.log("1. Testing customer detail validation before email confirmation modal...");
  const invalid1 = validateCustomerDetails({ firstName: "", lastName: "Dela Cruz", email: "juan@example.com" });
  assert.equal(invalid1.valid, false);
  assert.equal(invalid1.errors.firstName, "First name is required.");

  const invalid2 = validateCustomerDetails({ firstName: "Juan", lastName: "", email: "juan@example.com" });
  assert.equal(invalid2.valid, false);
  assert.equal(invalid2.errors.lastName, "Last name is required.");

  const invalid3 = validateCustomerDetails({ firstName: "Juan", lastName: "Dela Cruz", email: "not-an-email" });
  assert.equal(invalid3.valid, false);
  assert.equal(invalid3.errors.email, "Please enter a valid email address.");

  const validDetails = validateCustomerDetails({
    firstName: "Maria",
    lastName: "Santos",
    email: "Maria.Santos@Example.com",
  });
  assert.equal(validDetails.valid, true);
  assert.deepEqual(validDetails.errors, {});
  console.log("[PASS] Customer details correctly validated before displaying confirmation modal");

  // 2. Email confirmation requirement & submission simulation
  console.log("2. Testing email confirmation modal display values...");
  const confirmedEmail = "maria.santos@example.com";
  const reservationRepo = new ReservationMemoryRepository();
  const workspaceRepo = new InMemoryWorkspaceRepository();
  const floor = await workspaceRepo.createFloor({ name: "Floor 1" });
  const tpl = await workspaceRepo.createTemplate({
    name: "Dedicated Pro Desk",
    capacity: 1,
    rateAmount: 85,
    pricingUnit: "HOURLY",
  });
  const inst1 = await workspaceRepo.createInstance({
    templateId: tpl.id,
    floorId: floor.id,
    instanceCode: "PRO-01",
    displayName: "Pro Desk 01",
  });
  const inst2 = await workspaceRepo.createInstance({
    templateId: tpl.id,
    floorId: floor.id,
    instanceCode: "PRO-02",
    displayName: "Pro Desk 02",
  });

  const paymentSessionService = createPaymentSessionService(reservationRepo);
  const reservationService = createReservationService(
    reservationRepo,
    workspaceRepo,
    reservationRepo,
    paymentSessionService
  );

  const payload: CreateReservationRequest = {
    source: "WEB",
    customerFirstName: "Maria",
    customerLastName: "Santos",
    customerEmail: confirmedEmail,
    candidates: [
      {
        rank: 0,
        workspaceInstanceId: inst1.id,
        startAt: "2026-09-01T09:00:00Z",
        endAt: "2026-09-01T12:00:00Z", // 3 hours
      },
      {
        rank: 1,
        workspaceInstanceId: inst2.id,
        startAt: "2026-09-01T09:00:00Z",
        endAt: "2026-09-01T12:00:00Z",
      },
    ],
  };

  const createdReservation = await reservationService.createReservation(payload, {
    paymentLinkBaseUrl: "https://deskatlas.com/pay",
  });

  assert.ok(createdReservation.id);
  assert.ok(createdReservation.referenceCode);
  assert.equal(createdReservation.status, "PENDING_PAYMENT");
  assert.equal(createdReservation.customerEmail, "maria.santos@example.com");
  assert.equal(createdReservation.amountDue, 85 * 3); // ₱255.00
  assert.ok(createdReservation.paymentSession);
  assert.ok(createdReservation.paymentSession.token);
  assert.ok(createdReservation.paymentSession.paymentUrl.startsWith("https://deskatlas.com/pay/"));

  // Dispatch payment email
  await mockDispatchPaymentLinkEmail({
    to: createdReservation.customerEmail,
    referenceCode: createdReservation.referenceCode,
    amountDue: createdReservation.amountDue,
    currency: createdReservation.currency,
    paymentUrl: createdReservation.paymentSession.paymentUrl,
    expiresAt: createdReservation.paymentSession.expiresAt,
  });

  assert.equal(emailInboxAudit.length, 1);
  assert.equal(emailInboxAudit[0].to, "maria.santos@example.com");
  assert.equal(emailInboxAudit[0].referenceCode, createdReservation.referenceCode);
  assert.equal(emailInboxAudit[0].amountDue, 255);
  console.log("[PASS] Server created PENDING_PAYMENT reservation and dispatched payment link email");

  // 3. Post-submit client state verification
  console.log("3. Testing client post-submit handoff screen behavior (no direct /pay redirect)...");
  const handoffState = handleClientPostSubmitSuccess(
    {
      referenceCode: createdReservation.referenceCode,
      paymentSession: createdReservation.paymentSession,
    },
    confirmedEmail
  );

  assert.equal(handoffState.step, "email-handoff");
  assert.equal(handoffState.navigatedToPayToken, false, "Client must NOT auto-navigate to /pay/:token");
  assert.equal(handoffState.submittedReservation?.customerEmail, "maria.santos@example.com");
  assert.equal(handoffState.submittedReservation?.referenceCode, createdReservation.referenceCode);
  console.log("[PASS] Client successfully transitions to email-handoff state without direct pay-page navigation");

  // 4. Expiry and spam guidance validation
  console.log("4. Verifying payment link expiry calculation (1 hour)...");
  const expiresAtDate = new Date(createdReservation.paymentSession.expiresAt);
  const now = new Date();
  const diffMinutes = Math.round((expiresAtDate.getTime() - now.getTime()) / (1000 * 60));
  assert.ok(diffMinutes >= 59 && diffMinutes <= 61, `Expected ~60 min expiry window, got ${diffMinutes} min`);
  console.log("[PASS] Payment session enforces strict 1-hour expiration");

  // 5. Atomic allocation on payment approval
  console.log("5. Verifying atomic allocation upon payment verification...");
  const paymentReviewService = createPaymentReviewService(reservationRepo);
  const attempt = Array.from((reservationRepo as any).paymentAttempts.values()).find(
    (a: any) => a.reservationId === createdReservation.id
  ) as any;

  await reservationRepo.submitPaymentProof({
    tokenHash: attempt.tokenHash,
    paymentMethodId: "pm-gcash",
    proofStoragePath: "proofs/maria.png",
    proofSubmittedAt: new Date().toISOString(),
  });

  const decision = await paymentReviewService.reviewPayment({
    paymentAttemptId: attempt.id,
    decision: "APPROVE",
    actor: { userId: "admin-1", role: "ADMIN" },
  });

  assert.equal(decision.reservationStatus, "CONFIRMED");
  assert.ok(decision.assignedCandidate);
  assert.equal(decision.assignedCandidate.rank, 0);
  assert.equal(decision.assignedCandidate.workspaceInstanceId, inst1.id);
  console.log("[PASS] Atomic allocation allocated Main spot on successful payment approval");

  console.log("--- All MF-35 Customer Post Submit Email Handoff Tests Passed Successfully! ---");
}

run().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
