import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { Booking } from "./bookingModel";
import type { RootState } from "../state/store";

export type BookingFlowState = {
  step: "editing" | "review" | "submitting" | "success" | "soldOut";
  reviewedBooking: Booking | null;
  submitError: string | null;
  reference: string | null;
};
const initialState: BookingFlowState = {
  step: "editing",
  reviewedBooking: null,
  submitError: null,
  reference: null,
};
const bookingSlice = createSlice({
  name: "booking",
  initialState,
  reducers: {
    reviewBooking(state, action: PayloadAction<Booking>) {
      if (state.step !== "editing") return;
      state.step = "review";
      state.reviewedBooking = {
        email: action.payload.email,
        participants: action.payload.participants.map((person) => ({
          ...person,
        })),
      };
      state.submitError = null;
      state.reference = null;
    },
    editBooking(state) {
      if (state.step !== "review") return;
      state.step = "editing";
      state.reviewedBooking = null;
      state.submitError = null;
      state.reference = null;
    },
  },
});
export const { reviewBooking, editBooking } = bookingSlice.actions;
export const selectBookingFlow = (state: RootState) => state.booking;
export default bookingSlice.reducer;
