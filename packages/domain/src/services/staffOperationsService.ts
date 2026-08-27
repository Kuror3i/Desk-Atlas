import {
  OperationalActivityRecord,
  OccupancyRecord,
  ReservationOperationalActionRequest,
  ReservationOperationalActionResult,
  StaffOperationalReservation,
} from "../models/reservation";
import { StaffOperationsRepository } from "./staffOperationsRepository";

export class StaffOperationsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StaffOperationsError";
  }
}

export class StaffOperationsConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StaffOperationsConflictError";
  }
}

export class StaffOperationsService {
  constructor(
    private readonly staffOperationsRepository: StaffOperationsRepository,
    private readonly nowProvider: () => Date = () => new Date()
  ) {}

  async listOperationalReservations(): Promise<StaffOperationalReservation[]> {
    return this.staffOperationsRepository.listOperationalReservations(
      this.nowProvider().toISOString()
    );
  }

  async listOccupancy(): Promise<OccupancyRecord[]> {
    return this.staffOperationsRepository.listOccupancy(this.nowProvider().toISOString());
  }

  async listOperationalActivity(limit = 20): Promise<OperationalActivityRecord[]> {
    if (!Number.isInteger(limit) || limit <= 0) {
      throw new StaffOperationsError("Activity limit must be a positive integer.");
    }

    return this.staffOperationsRepository.listOperationalActivity(limit);
  }

  async checkInReservation(
    request: ReservationOperationalActionRequest
  ): Promise<ReservationOperationalActionResult> {
    const actor = validateActor(request);
    return this.staffOperationsRepository.checkInReservation({
      reservationId: request.reservationId,
      actorUserId: actor.userId,
      actorRole: actor.role,
      actedAt: this.nowProvider().toISOString(),
    });
  }

  async checkOutReservation(
    request: ReservationOperationalActionRequest
  ): Promise<ReservationOperationalActionResult> {
    const actor = validateActor(request);
    return this.staffOperationsRepository.checkOutReservation({
      reservationId: request.reservationId,
      actorUserId: actor.userId,
      actorRole: actor.role,
      actedAt: this.nowProvider().toISOString(),
    });
  }
}

function validateActor(request: ReservationOperationalActionRequest) {
  if (!request.reservationId || request.reservationId.trim() === "") {
    throw new StaffOperationsError("Reservation ID is required.");
  }

  if (!request.actor?.userId || request.actor.userId.trim() === "") {
    throw new StaffOperationsError("Actor user ID is required.");
  }

  if (request.actor.role !== "ADMIN" && request.actor.role !== "STAFF") {
    throw new StaffOperationsConflictError(
      "Only ADMIN or STAFF may perform reservation operational actions."
    );
  }

  return request.actor;
}

export function createStaffOperationsService(
  staffOperationsRepository: StaffOperationsRepository,
  nowProvider?: () => Date
) {
  return new StaffOperationsService(staffOperationsRepository, nowProvider);
}
