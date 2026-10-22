import { configureStore } from "@reduxjs/toolkit";
import { bookingReducer } from "../../pages/booking";

export const createAppStore = () =>
  configureStore({ reducer: { booking: bookingReducer } });
export const store = createAppStore();
export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
