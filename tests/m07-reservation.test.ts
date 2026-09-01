import * as assert from "assert";
import {
  ReservationMemoryRepository,
  createPaymentSessionService,
  createReservationService,
  CreateReservationRequest,
  CandidateValidationError,
  ReservationError
} from "../packages/domain/src/index";
import { InMemoryWorkspaceRepository } from "../packages/domain/src/index";

async function runTests() {
  const reservationRepo = new ReservationMemoryRepository();
  const workspaceRepo = new InMemoryWorkspaceRepository();
  const paymentSessionService = createPaymentSessionService(reservationRepo);
  const service = createReservationService(
    reservationRepo,
    workspaceRepo,
    reservationRepo,
    paymentSessionService
  );

  const floor = await workspaceRepo.createFloor({ name: 'Test Floor' });
  const floorId = floor.id;

  const template = await workspaceRepo.createTemplate({
    name: 'Test Template',
    capacity: 1,
    rateAmount: 100,
    pricingUnit: 'HOURLY',
    defaultShape: 'rectangle',
    defaultColor: '#000000',
    isActive: true,
  });
  const templateId = template.id;

  const instance1 = await workspaceRepo.createInstance({
    templateId,
    floorId,
    instanceCode: 'T1',
    displayName: 'Test Instance 1',
  });
  const instance1Id = instance1.id;

  const instance2 = await workspaceRepo.createInstance({
    templateId,
    floorId,
    instanceCode: 'T2',
    displayName: 'Test Instance 2',
  });
  const instance2Id = instance2.id;

  function runTestSync(name: string, fn: () => void) {
    try {
      fn();
      console.log(`[PASS] ${name}`);
    } catch (err: any) {
      console.error(`[FAIL] ${name}:`, err.message);
      process.exit(1);
    }
  }

  async function runTest(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
    } catch (err: any) {
      console.error(`[FAIL] ${name}:`, err.message);
      process.exit(1);
    }
  }

  async function expectThrow(fn: () => Promise<void>, name: string) {
    let threw = false;
    try {
      await fn();
    } catch (err: any) {
      if (err instanceof ReservationError || err instanceof CandidateValidationError) {
        threw = true;
      } else {
        console.error(`[FAIL] ${name}: Threw unexpected error`, err);
        process.exit(1);
      }
    }
    if (!threw) {
      console.error(`[FAIL] ${name}: Expected Error but did not throw.`);
      process.exit(1);
    } else {
      console.log(`[PASS] ${name}`);
    }
  }

  await runTest("successfully create a valid reservation with no hold", async () => {
    const request: CreateReservationRequest = {
      source: 'WEB',
      customerFirstName: 'John',
      customerLastName: 'Doe',
      customerEmail: 'john@example.com',
      candidates: [
        {
          rank: 0,
          workspaceInstanceId: instance1Id,
          startAt: '2027-01-01T09:00:00Z',
          endAt: '2027-01-01T11:00:00Z',
        }
      ]
    };

    const reservation = await service.createReservation(request, {
      paymentLinkBaseUrl: "https://deskatlas.test/pay",
    });
    
    assert.ok(reservation.id);
    assert.ok(reservation.referenceCode);
    assert.strictEqual(reservation.status, 'PENDING_PAYMENT');
    assert.strictEqual(reservation.rateSnapshot, 100);
    assert.strictEqual(reservation.amountDue, 200); // 2 hours
    assert.strictEqual(reservation.candidates?.length, 1);
    assert.strictEqual(reservation.candidates?.[0].isAssigned, false); // No hold
    assert.ok(reservation.paymentSession?.token);
    assert.ok(reservation.paymentSession?.paymentUrl.includes(reservation.paymentSession.token));
  });

  await runTest("allow up to 2 alternative candidates", async () => {
    const request: CreateReservationRequest = {
      source: 'WEB',
      customerFirstName: 'Jane',
      customerLastName: 'Smith',
      customerEmail: 'jane@example.com',
      candidates: [
        {
          rank: 0,
          workspaceInstanceId: instance1Id,
          startAt: '2027-01-01T09:00:00Z',
          endAt: '2027-01-01T11:00:00Z',
        },
        {
          rank: 1,
          workspaceInstanceId: instance2Id,
          startAt: '2027-01-01T09:00:00Z',
          endAt: '2027-01-01T11:00:00Z',
        }
      ]
    };

    const reservation = await service.createReservation(request, {
      paymentLinkBaseUrl: "https://deskatlas.test/pay",
    });
    assert.strictEqual(reservation.candidates?.length, 2);
  });

  await expectThrow(async () => {
    const request: CreateReservationRequest = {
      source: 'WEB',
      customerFirstName: '',
      customerLastName: 'Doe',
      customerEmail: 'john@example.com',
      candidates: [
        {
          rank: 0,
          workspaceInstanceId: instance1Id,
          startAt: '2027-01-01T09:00:00Z',
          endAt: '2027-01-01T11:00:00Z',
        }
      ]
    };
    await service.createReservation(request, {
      paymentLinkBaseUrl: "https://deskatlas.test/pay",
    });
  }, "reject requests with missing customer info");

  await expectThrow(async () => {
    const request: CreateReservationRequest = {
      source: 'WEB',
      customerFirstName: 'John',
      customerLastName: 'Doe',
      customerEmail: 'not-an-email',
      candidates: [
        {
          rank: 0,
          workspaceInstanceId: instance1Id,
          startAt: '2027-01-01T09:00:00Z',
          endAt: '2027-01-01T11:00:00Z',
        }
      ]
    };
    await service.createReservation(request, {
      paymentLinkBaseUrl: "https://deskatlas.test/pay",
    });
  }, "reject invalid email format");

  await expectThrow(async () => {
    const request: CreateReservationRequest = {
      source: 'WEB',
      customerFirstName: 'John',
      customerLastName: 'Doe',
      customerEmail: 'john@example.com',
      candidates: [
        {
          rank: 0,
          workspaceInstanceId: instance1Id,
          startAt: '2027-01-01T09:00:00Z',
          endAt: '2027-01-01T11:00:00Z',
        },
        {
          rank: 1,
          workspaceInstanceId: instance1Id, // duplicate
          startAt: '2027-01-01T09:00:00Z',
          endAt: '2027-01-01T11:00:00Z',
        }
      ]
    };
    await service.createReservation(request, {
      paymentLinkBaseUrl: "https://deskatlas.test/pay",
    });
  }, "throw validation error if candidates violate rules (e.g. same instance)");

  console.log("All M07 tests passed!");
}

runTests().catch(err => {
  console.error("Test suite failed:", err);
  process.exit(1);
});
