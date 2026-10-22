import type { Booking } from "../model/bookingModel";

export type ConfirmResult =
  { kind: "success"; reference: string } | { kind: "soldOut" };
export type BookingService = {
  confirm(booking: Booking): Promise<ConfirmResult>;
};

export function createBookingService(search: string): BookingService {
  const soldOut = new URLSearchParams(search).get("scenario") === "sold-out";
  return {
    async confirm(_booking) {
      await new Promise<void>((resolve) => setTimeout(resolve, 600));
      return soldOut
        ? { kind: "soldOut" }
        : { kind: "success", reference: "DEMO-001" };
    },
  };
}
