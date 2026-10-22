import { afterEach, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import BookingResult from "./BookingResult";
import BookingReview from "./BookingReview";
import { createBookingService } from "./bookingService";
import type { BookingService } from "./bookingService";
import {
  startConfirmation,
  confirmationFinished,
  confirmationFailed,
} from "./bookingSlice";
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
    for (const step of ["submitting", "success"] as const) {
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

describe("Mock confirm — сервис и отображение результата", () => {
  afterEach(() => {
    vi.useRealTimers();
  });
  it.each(["", "?scenario=sold-out"])(
    "U06/U07 — фактический вызов confirm: %s",
    async (search) => {
      vi.useFakeTimers();
      const store = createAppStore();
      const service = createBookingService(search);
      store.dispatch(reviewBooking(booking));
      store.dispatch(startConfirmation());
      const request = service.confirm(booking);
      let finished = false;
      void request.then(() => {
        finished = true;
      });
      await vi.advanceTimersByTimeAsync(599);
      expect(finished).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      const result = await request;
      expect(result).toEqual(
        search
          ? { kind: "soldOut" }
          : { kind: "success", reference: "DEMO-001" },
      );
      store.dispatch(confirmationFinished(result));
      expect(store.getState().booking.reviewedBooking).toEqual(booking);
      const markup =
        result.kind === "success"
          ? renderToStaticMarkup(
              createElement(BookingResult, {
                booking,
                kind: "success",
                reference: result.reference,
              }),
            )
          : renderToStaticMarkup(
              createElement(BookingResult, {
                booking,
                kind: "soldOut",
                onEdit() {},
                onRetry() {},
              }),
            );
      expect(markup).toContain("Анна");
      expect(markup).toContain("demo@example.com");
      if (result.kind === "success") expect(markup).toContain("DEMO-001");
      else {
        expect(markup).toContain("Заказ не оформлен");
        expect(markup).not.toContain("DEMO-");
        const retry = service.confirm(booking);
        await vi.advanceTimersByTimeAsync(600);
        expect(await retry).toEqual({ kind: "soldOut" });
      }
    },
  );
  it("U05 — разметка pending содержит status и disabled действий", () => {
    const markup = renderToStaticMarkup(
      createElement(BookingReview, {
        booking,
        pending: true,
        error: null,
        onEdit() {},
        onConfirm() {},
      }),
    );
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain('role="status"');
    expect(markup.match(/disabled=""/g)).toHaveLength(2);
    expect(markup).toContain("Подтверждаем");
  });
  it("U10 — reject подставного сервиса отдельно от soldOut, снимок сохранен", async () => {
    const store = createAppStore();
    const service: BookingService = {
      confirm: vi.fn().mockRejectedValue(new Error("test")),
    };
    store.dispatch(reviewBooking(booking));
    store.dispatch(startConfirmation());
    try {
      await service.confirm(booking);
    } catch {
      store.dispatch(
        confirmationFailed("Не удалось проверить заказ. Попробуйте еще раз."),
      );
    }
    expect(store.getState().booking.step).toBe("review");
    expect(store.getState().booking.reviewedBooking).toEqual(booking);
    expect(store.getState().booking.reference).toBeNull();
    expect(store.getState().booking.submitError).toContain(
      "Не удалось проверить заказ",
    );
    const markup = renderToStaticMarkup(
      createElement(BookingReview, {
        booking,
        pending: false,
        error: store.getState().booking.submitError,
        onEdit() {},
        onConfirm() {},
      }),
    );
    expect(markup).toContain('role="alert"');
    expect(markup).not.toContain('disabled=""');
  });
});
