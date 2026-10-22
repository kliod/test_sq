import { configureStore } from '@reduxjs/toolkit';
import booking from '../booking/bookingSlice';
export const createAppStore = () => configureStore({ reducer: { booking } });
export const store = createAppStore();
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
