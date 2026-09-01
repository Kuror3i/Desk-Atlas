import assert from "node:assert/strict";
import {
  CandidateValidationError,
  CandidateValidationContext,
  InMemoryWorkspaceRepository,
  ReservationMemoryRepository,
  createPaymentSessionService,
  createReservationService,
  validateCandidates,
  type CandidateSubmissionDTO,
  type CreateReservationRequest,
  type ReservationResponseDTO,
} from "../packages/domain/src/index";
import { WorkspaceInstance, WorkspaceTemplate } from "../packages/domain/src/models/workspace";

// Client-side helper simulation matching ReservationPage.tsx
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

function buildReservationPayload(
  customer: { firstName: string; lastName: string; email: string },
  candidates: Array<{
    rank: 0 | 1 | 2;
    workspaceInstanceId: string;
    date: string;
    startTime: string;
    endTime: string;
  }>
): CreateReservationRequest {
  return {
    source: "WEB",
    customerFirstName: customer.firstName.trim(),
    customerLastName: customer.lastName.trim(),
    customerEmail: customer.email.trim().toLowerCase(),
    candidates: candidates.map((c) => ({
      rank: c.rank,
      workspaceInstanceId: c.workspaceInstanceId,
      startAt: `${c.date}T${c.startTime}:00Z`,
      endAt: `${c.date}T${c.endTime}:00Z`,
    })),
  };
}

async function run() {
  console.log("--- Starting MF-23 Customer Reservation Summary & Details Bottom Tests ---");

  const TEMPLATE_HOT_DESK: WorkspaceTemplate = {
    id: "tpl-hot-desk",
    name: "Dedicated Hot Desk",
    description: "Standard single desk",
    photoPath: "/photos/hot-desk.jpg",
    capacity: 1,
    rateAmount: 60,
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
      id: "inst-desk-01",
      templateId: "tpl-hot-desk",
      floorId: "floor-1",
      instanceCode: "HD-01",
      displayName: "Hot Desk 01",
      operationalStatus: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "inst-desk-02",
      templateId: "tpl-hot-desk",
      floorId: "floor-1",
      instanceCode: "HD-02",
      displayName: "Hot Desk 02",
      operationalStatus: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "inst-desk-03",
      templateId: "tpl-hot-desk",
      floorId: "floor-1",
      instanceCode: "HD-03",
      displayName: "Hot Desk 03",
      operationalStatus: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const validationContext: CandidateValidationContext = {
    instances: INSTANCES,
    templates: [TEMPLATE_HOT_DESK],
  };

  // 1. Test Customer Detail Validation Rules (MF-23 AC: Only first name, last name, email; block if invalid)
  console.log("1. Testing customer detail validation rules...");

  // Missing first name
  const res1 = validateCustomerDetails({ firstName: "", lastName: "Santos", email: "maria@example.com" });
  assert.equal(res1.valid, false);
  assert.equal(res1.errors.firstName, "First name is required.");

  // Missing last name
  const res2 = validateCustomerDetails({ firstName: "Maria", lastName: "   ", email: "maria@example.com" });
  assert.equal(res2.valid, false);
  assert.equal(res2.errors.lastName, "Last name is required.");

  // Missing email
  const res3 = validateCustomerDetails({ firstName: "Maria", lastName: "Santos", email: "" });
  assert.equal(res3.valid, false);
  assert.equal(res3.errors.email, "Email address is required.");

  // Invalid email format
  const res4 = validateCustomerDetails({ firstName: "Maria", lastName: "Santos", email: "not-an-email" });
  assert.equal(res4.valid, false);
  assert.equal(res4.errors.email, "Please enter a valid email address.");

  // Valid inputs
  const res5 = validateCustomerDetails({
    firstName: "  Maria  ",
    lastName: "  Santos  ",
    email: "  MARIA.SANTOS@example.com  ",
  });
  assert.equal(res5.valid, true);
  assert.deepEqual(res5.errors, {});
  console.log("[PASS] Customer detail validation correctly accepts only valid first name, last name, and email");

  // 2. Test Payload Creation with Ranked Candidates & Timing
  console.log("2. Testing payload construction for Main + 2 Backups...");
  const sampleCandidates = [
    {
      rank: 0 as const,
      workspaceInstanceId: "inst-desk-01",
      date: "2026-10-15",
      startTime: "09:00",
      endTime: "13:00",
    },
    {
      rank: 1 as const,
      workspaceInstanceId: "inst-desk-02",
      date: "2026-10-15",
      startTime: "10:00",
      endTime: "14:00",
    },
    {
      rank: 2 as const,
      workspaceInstanceId: "inst-desk-03",
      date: "2026-10-15",
      startTime: "13:00",
      endTime: "17:00",
    },
  ];

  const payload = buildReservationPayload(
    { firstName: "Maria", lastName: "Santos", email: "Maria.Santos@Example.com" },
    sampleCandidates
  );

  assert.equal(payload.source, "WEB");
  assert.equal(payload.customerFirstName, "Maria");
  assert.equal(payload.customerLastName, "Santos");
  assert.equal(payload.customerEmail, "maria.santos@example.com");
  assert.equal(payload.candidates.length, 3);
  assert.equal(payload.candidates[0].startAt, "2026-10-15T09:00:00Z");
  assert.equal(payload.candidates[0].endAt, "2026-10-15T13:00:00Z");
  assert.equal(payload.candidates[1].startAt, "2026-10-15T10:00:00Z");
  assert.equal(payload.candidates[1].endAt, "2026-10-15T14:00:00Z");
  assert.equal(payload.candidates[2].startAt, "2026-10-15T13:00:00Z");
  assert.equal(payload.candidates[2].endAt, "2026-10-15T17:00:00Z");

  validateCandidates(payload.candidates, validationContext);
  console.log("[PASS] Payload successfully formatted and validated against domain rules");

  // 3. Test Full Reservation Creation with Payment Session Generation
  console.log("3. Testing End-to-End reservation creation with payment session...");
  const resRepo = new ReservationMemoryRepository();
  const wsRepo = new InMemoryWorkspaceRepository();
  const paySessionSvc = createPaymentSessionService(resRepo);
  const resService = createReservationService(resRepo, wsRepo, resRepo, paySessionSvc);

  const floor = await wsRepo.createFloor({ name: "2nd Floor Main" });
  const template = await wsRepo.createTemplate({
    name: "Dedicated Hot Desk",
    capacity: 1,
    rateAmount: 60,
    pricingUnit: "HOURLY",
    defaultShape: "rectangle",
    defaultColor: "#E0EFE4",
    isActive: true,
  });

  const inst1 = await wsRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: "HD-01",
    displayName: "Hot Desk 01",
  });
  const inst2 = await wsRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: "HD-02",
    displayName: "Hot Desk 02",
  });
  const inst3 = await wsRepo.createInstance({
    templateId: template.id,
    floorId: floor.id,
    instanceCode: "HD-03",
    displayName: "Hot Desk 03",
  });

  const reservationRequest: CreateReservationRequest = {
    source: "WEB",
    customerFirstName: "Maria",
    customerLastName: "Santos",
    customerEmail: "maria.santos@example.com",
    candidates: [
      {
        rank: 0,
        workspaceInstanceId: inst1.id,
        startAt: "2026-10-15T09:00:00Z",
        endAt: "2026-10-15T13:00:00Z", // 4 hours
      },
      {
        rank: 1,
        workspaceInstanceId: inst2.id,
        startAt: "2026-10-15T10:00:00Z",
        endAt: "2026-10-15T14:00:00Z", // 4 hours
      },
      {
        rank: 2,
        workspaceInstanceId: inst3.id,
        startAt: "2026-10-15T11:00:00Z",
        endAt: "2026-10-15T15:00:00Z", // 4 hours
      },
    ],
  };

  const createdReservation = await resService.createReservation(reservationRequest, {
    paymentLinkBaseUrl: "https://deskatlas.test/pay",
  });

  assert.ok(createdReservation.id);
  assert.ok(createdReservation.referenceCode);
  assert.equal(createdReservation.status, "PENDING_PAYMENT");
  assert.equal(createdReservation.customerFirstName, "Maria");
  assert.equal(createdReservation.customerLastName, "Santos");
  assert.equal(createdReservation.customerEmail, "maria.santos@example.com");
  assert.equal(createdReservation.rateSnapshot, 60);
  assert.equal(createdReservation.amountDue, 240, "4 hours * 60 = 240");
  assert.equal(createdReservation.candidates?.length, 3);

  // Verify all candidates have isAssigned = false (No-Hold Rule)
  assert.equal(createdReservation.candidates[0].isAssigned, false);
  assert.equal(createdReservation.candidates[1].isAssigned, false);
  assert.equal(createdReservation.candidates[2].isAssigned, false);

  // Verify 1-hour payment session
  assert.ok(createdReservation.paymentSession);
  assert.ok(createdReservation.paymentSession.token);
  assert.ok(createdReservation.paymentSession.paymentUrl.includes(createdReservation.paymentSession.token));
  assert.ok(new Date(createdReservation.paymentSession.expiresAt).getTime() > Date.now());

  console.log("[PASS] Guest reservation successfully created with 1-hour payment session, no hold, and correct amount");

  console.log("--- All MF-23 Customer Reservation Summary & Details Bottom Tests Passed Successfully! ---");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
