import { createSlice } from '@reduxjs/toolkit';
const initialState = {
  step: 'editing' as 'editing' | 'review' | 'submitting' | 'success' | 'soldOut',
  reviewedBooking: null,
  submitError: null,
  reference: null,
};
const bookingSlice = createSlice({ name: 'booking', initialState, reducers: {} });
export default bookingSlice.reducer;
