import { describe, expect, it } from "vitest";
import reducer, {
  editBooking,
  reviewBooking,
  selectBookingFlow,
} from "./bookingSlice";
import type { BookingFlowState } from "./bookingSlice";
import type { Booking } from "./bookingModel";
import { createAppStore } from "../state/store";

const booking: Booking = {
  participants: [{ name: "Анна", age: 18 }],
  email: "demo@example.com",
};
describe("S01/S02 — editing и review", () => {
  it("начинает с editing без снимка, цены и черновика", () => {
    const store = createAppStore();
    expect(selectBookingFlow(store.getState())).toEqual({
      step: "editing",
      reviewedBooking: null,
      submitError: null,
      reference: null,
    });
  });
  it("переходит на review с независимым снимком и очищает старый результат", () => {
    const state: BookingFlowState = {
      step: "editing",
      reviewedBooking: null,
      submitError: "Ошибка",
      reference: "OLD",
    };
    const next = reducer(state, reviewBooking(booking));
    expect(next).toEqual({
      step: "review",
      reviewedBooking: booking,
      submitError: null,
      reference: null,
    });
    expect(next.reviewedBooking).not.toBe(booking);
    expect(next.reviewedBooking?.participants[0]).not.toBe(
      booking.participants[0],
    );
    expect(state.step).toBe("editing");
  });
  it("возврат очищает снимок; следующий review использует новые данные", () => {
    const reviewed = reducer(undefined, reviewBooking(booking));
    const editing = reducer(
      { ...reviewed, submitError: "Ошибка", reference: "OLD" },
      editBooking(),
    );
    expect(editing).toEqual({
      step: "editing",
      reviewedBooking: null,
      submitError: null,
      reference: null,
    });
    const changed: Booking = {
      ...booking,
      participants: [{ name: "Анна", age: 14 }],
    };
    expect(reducer(editing, reviewBooking(changed)).reviewedBooking).toEqual(
      changed,
    );
  });
  it("повторный review не заменяет уже проверенный снимок", () => {
    const state = reducer(undefined, reviewBooking(booking));
    expect(
      reducer(state, reviewBooking({ ...booking, email: "other@example.com" })),
    ).toBe(state);
  });
  it("недопустимые события не меняют состояние", () => {
    const editing = reducer(undefined, { type: "unknown" });
    expect(reducer(editing, editBooking())).toBe(editing);
    for (const step of ["submitting", "success", "soldOut"] as const) {
      const state = { ...editing, step };
      expect(reducer(state, editBooking())).toBe(state);
      expect(reducer(state, reviewBooking(booking))).toBe(state);
    }
  });
  it("store изолирован, состояние и actions сериализуемы", () => {
    const a = createAppStore();
    const b = createAppStore();
    const action = reviewBooking(booking);
    a.dispatch(action);
    expect(selectBookingFlow(b.getState()).step).toBe("editing");
    expect(JSON.parse(JSON.stringify(a.getState()))).toEqual(a.getState());
    expect(JSON.parse(JSON.stringify(action))).toEqual(action);
  });
});
