import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import App from "../App";
import { AppProviders } from "../providers/AppProviders";
import {
  createBookingService,
  reviewBooking,
  editBooking,
  startConfirmation,
  confirmationFinished,
  confirmationFailed,
} from "../../pages/booking";
import type { Booking, BookingService } from "../../pages/booking";
import { createAppStore } from "./store";
import type { AppStore } from "./store";
import { selectBookingFlow } from "./selectors";

const booking: Booking = {
  participants: [{ name: "Анна", age: 18 }],
  email: "demo@example.com",
};

// SSR проверяет сборку представления; клики, эффекты и guard требуют DOM.
function renderApp(store: AppStore, service: BookingService) {
  return renderToStaticMarkup(
    <AppProviders store={store}>
      <App service={service} />
    </AppProviders>,
  );
}

describe("Граница app/booking — Provider, store, сервис и SSR", () => {
  afterEach(() => vi.useRealTimers());

  it("показывает форму через Provider, до подтверждения сервис не вызывается", () => {
    const store = createAppStore();
    const service: BookingService = { confirm: vi.fn() };
    const markup = renderApp(store, service);
    expect(markup).toContain("Оформление билетов");
    expect(markup).toContain('name="participants.0.age"');
    expect(markup).toContain('name="email"');
    expect(markup).toContain("Проверить заказ");
    expect(service.confirm).not.toHaveBeenCalled();
  });

  it("Provider читает переданный store, снимки и actions сериализуемы", () => {
    const a = createAppStore();
    const b = createAppStore();
    const service: BookingService = { confirm: vi.fn() };
    const action = reviewBooking(booking);
    a.dispatch(action);
    expect(selectBookingFlow(b.getState()).step).toBe("editing");
    expect(renderApp(a, service)).toContain("Проверьте заказ");
    expect(renderApp(a, service)).toContain("Анна");
    expect(renderApp(b, service)).toContain("Оформление билетов");
    expect(JSON.parse(JSON.stringify(a.getState()))).toEqual(a.getState());
    expect(JSON.parse(JSON.stringify(action))).toEqual(action);
    expect(service.confirm).not.toHaveBeenCalled();
  });

  it.each(["", "?scenario=sold-out"])(
    "собирает review/pending/result с фактическим mock: %s",
    async (search) => {
      vi.useFakeTimers();
      const store = createAppStore();
      const service = createBookingService(search);
      store.dispatch(reviewBooking(booking));
      expect(renderApp(store, service)).toContain("Проверьте заказ");
      store.dispatch(startConfirmation());
      const request = service.confirm(
        selectBookingFlow(store.getState()).reviewedBooking!,
      );
      let finished = false;
      void request.then(() => {
        finished = true;
      });
      await vi.advanceTimersByTimeAsync(599);
      expect(finished).toBe(false);
      const pending = renderApp(store, service);
      expect(pending).toContain('aria-busy="true"');
      expect(pending).toContain('role="status"');
      expect(pending.match(/disabled=""/g)).toHaveLength(2);
      await vi.advanceTimersByTimeAsync(1);
      const result = await request;
      expect(result).toEqual(
        search
          ? { kind: "soldOut" }
          : { kind: "success", reference: "DEMO-001" },
      );
      store.dispatch(confirmationFinished(result));
      expect(selectBookingFlow(store.getState()).reviewedBooking).toEqual(
        booking,
      );
      const markup = renderApp(store, service);
      expect(markup).toContain("Анна");
      expect(markup).toContain("demo@example.com");
      if (result.kind === "success") {
        expect(markup).toContain("Тестовый заказ подтвержден");
        expect(markup).toContain("DEMO-001");
      } else {
        expect(markup).toContain("Заказ не оформлен");
        expect(markup).not.toContain("DEMO-");
        store.dispatch(startConfirmation());
        const retry = service.confirm(booking);
        await vi.advanceTimersByTimeAsync(600);
        const retryResult = await retry;
        expect(retryResult).toEqual({ kind: "soldOut" });
        store.dispatch(confirmationFinished(retryResult));
        expect(renderApp(store, service)).toContain("Заказ не оформлен");
        store.dispatch(editBooking());
        expect(renderApp(store, service)).toContain("Оформление билетов");
      }
    },
  );

  it("отображает техническую ошибку на review и снимает pending", async () => {
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
    expect(selectBookingFlow(store.getState()).reviewedBooking).toEqual(
      booking,
    );
    expect(selectBookingFlow(store.getState()).reference).toBeNull();
    const markup = renderApp(store, service);
    expect(markup).toContain("Проверьте заказ");
    expect(markup).toContain("Не удалось проверить заказ");
    expect(markup).toContain('role="alert"');
    expect(markup).not.toContain('disabled=""');
    expect(markup).not.toContain("Заказ не оформлен");
  });
});
