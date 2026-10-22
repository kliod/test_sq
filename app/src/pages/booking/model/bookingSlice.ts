import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { ConfirmResult } from "../api/bookingService";
import type { Booking } from "./bookingModel";

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
    startConfirmation(state) {
      if (
        (state.step !== "review" && state.step !== "soldOut") ||
        !state.reviewedBooking
      )
        return;
      state.step = "submitting";
      state.submitError = null;
      state.reference = null;
    },
    confirmationFinished(state, action: PayloadAction<ConfirmResult>) {
      if (state.step !== "submitting" || !state.reviewedBooking) return;
      if (action.payload.kind === "success") {
        if (!action.payload.reference.trim()) return;
        state.step = "success";
        state.reference = action.payload.reference;
      } else {
        state.step = "soldOut";
        state.reference = null;
      }
      state.submitError = null;
    },
    confirmationFailed(state, action: PayloadAction<string>) {
      if (state.step !== "submitting" || !state.reviewedBooking) return;
      state.step = "review";
      state.submitError = action.payload;
      state.reference = null;
    },
    editBooking(state) {
      if (state.step !== "review" && state.step !== "soldOut") return;
      state.step = "editing";
      state.reviewedBooking = null;
      state.submitError = null;
      state.reference = null;
    },
  },
});
export const {
  reviewBooking,
  editBooking,
  startConfirmation,
  confirmationFinished,
  confirmationFailed,
} = bookingSlice.actions;
export default bookingSlice.reducer;
