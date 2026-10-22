import { useEffect, useRef } from "react";
import type { Booking } from "../model/bookingModel";
import BookingSummary from "./BookingSummary";

type Props = {
  booking: Booking;
  pending: boolean;
  error: string | null;
  onEdit: () => void;
  onConfirm: () => void;
};
export default function BookingReview({
  booking,
  pending,
  error,
  onEdit,
  onConfirm,
}: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  const status = useRef<HTMLParagraphElement>(null);
  const errorMessage = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  useEffect(() => {
    if (pending) status.current?.focus();
    else if (error) errorMessage.current?.focus();
  }, [pending, error]);
  return (
    <section className="review-screen" aria-busy={pending}>
      <h1 ref={heading} tabIndex={-1}>
        Проверьте заказ
      </h1>
      <p className="screen-intro">
        Проверьте участников, тарифы и общий email перед подтверждением.
      </p>
      <div className="review-card">
        <BookingSummary booking={booking} />
        <p className="contact-value">
          <span className="muted">Контактный email</span>
          <strong>{booking.email}</strong>
        </p>
      </div>
      {error && (
        <p
          ref={errorMessage}
          tabIndex={-1}
          role="alert"
          className="error notice"
        >
          {error}
        </p>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onConfirm();
        }}
      >
        <div className="actions">
          <button type="button" disabled={pending} onClick={onEdit}>
            Изменить
          </button>
          <button className="primary" type="submit" disabled={pending}>
            {pending ? "Подтверждаем…" : "Подтвердить заказ"}
          </button>
        </div>
      </form>
      <p className="pending-status" ref={status} tabIndex={-1} role="status">
        {pending ? "Подтверждаем демонстрационный заказ." : ""}
      </p>
    </section>
  );
}
