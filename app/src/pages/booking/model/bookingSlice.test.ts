import { describe, expect, it } from "vitest";
import reducer, {
  editBooking,
  reviewBooking,
  startConfirmation,
  confirmationFinished,
  confirmationFailed,
} from "./bookingSlice";
import type { BookingFlowState } from "./bookingSlice";
import type { Booking } from "./bookingModel";

const booking: Booking = {
  participants: [{ name: "Анна", age: 18 }],
  email: "demo@example.com",
};
describe("S01/S02 — editing и review", () => {
  it("начинает с editing без снимка, цены и черновика", () => {
    const state = reducer(undefined, { type: "init" });
    expect(state).toEqual({
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
    for (const step of ["submitting", "success"] as const) {
      const state = { ...editing, step };
      expect(reducer(state, editBooking())).toBe(state);
      expect(reducer(state, reviewBooking(booking))).toBe(state);
    }
  });
});

describe("S02 — подтверждение и результаты", () => {
  const reviewed = () => reducer(undefined, reviewBooking(booking));
  it("начало запроса очищает ошибку и номер, блокирует editing и review", () => {
    const state = reducer(
      { ...reviewed(), submitError: "Ошибка", reference: "OLD" },
      startConfirmation(),
    );
    expect(state).toEqual({
      step: "submitting",
      reviewedBooking: booking,
      submitError: null,
      reference: null,
    });
    expect(reducer(state, startConfirmation())).toBe(state);
    expect(reducer(state, editBooking())).toBe(state);
    expect(reducer(state, reviewBooking(booking))).toBe(state);
  });
  it("success сохраняет снимок и требует номер", () => {
    const pending = reducer(reviewed(), startConfirmation());
    expect(
      reducer(
        pending,
        confirmationFinished({ kind: "success", reference: "" }),
      ),
    ).toBe(pending);
    expect(
      reducer(
        pending,
        confirmationFinished({ kind: "success", reference: "DEMO-001" }),
      ),
    ).toEqual({
      step: "success",
      reviewedBooking: booking,
      submitError: null,
      reference: "DEMO-001",
    });
  });
  it("soldOut сохраняет снимок без номера, разрешает повтор и изменение", () => {
    const sold = reducer(
      reducer(reviewed(), startConfirmation()),
      confirmationFinished({ kind: "soldOut" }),
    );
    expect(sold).toEqual({
      step: "soldOut",
      reviewedBooking: booking,
      submitError: null,
      reference: null,
    });
    const retry = reducer(sold, startConfirmation());
    expect(retry.step).toBe("submitting");
    expect(retry.reviewedBooking).toEqual(booking);
    expect(reducer(sold, editBooking())).toEqual({
      step: "editing",
      reviewedBooking: null,
      submitError: null,
      reference: null,
    });
  });
  it("reject возвращает review и позволяет повторить с тем же снимком", () => {
    const pending = reducer(reviewed(), startConfirmation());
    const failed = reducer(pending, confirmationFailed("Ошибка"));
    expect(failed).toEqual({
      step: "review",
      reviewedBooking: booking,
      submitError: "Ошибка",
      reference: null,
    });
    const retry = reducer(failed, startConfirmation());
    expect(retry.submitError).toBeNull();
    expect(retry.reviewedBooking).toBe(failed.reviewedBooking);
    expect(retry.step).toBe("submitting");
  });
  it("результаты принимаются только в submitting со снимком", () => {
    for (const step of ["editing", "review", "success", "soldOut"] as const) {
      const state = { ...reviewed(), step };
      expect(reducer(state, confirmationFinished({ kind: "soldOut" }))).toBe(
        state,
      );
      expect(reducer(state, confirmationFailed("Ошибка"))).toBe(state);
    }
    const empty: BookingFlowState = {
      step: "submitting",
      reviewedBooking: null,
      submitError: null,
      reference: null,
    };
    expect(
      reducer(
        empty,
        confirmationFinished({ kind: "success", reference: "DEMO-001" }),
      ),
    ).toBe(empty);
    const editing = reducer(undefined, { type: "unknown" });
    expect(reducer(editing, startConfirmation())).toBe(editing);
  });
});
