import { CreateReservationRequest, ReservationResponseDTO } from "../models/reservation";
import { CreateWebPaymentSessionInput } from "./paymentSessionRepository";

export interface ReservationRepository {
  createReservation(
    request: CreateReservationRequest,
    rateSnapshot: number,
    amountDue: number,
    paymentSession?: CreateWebPaymentSessionInput
  ): Promise<ReservationResponseDTO>;
}
