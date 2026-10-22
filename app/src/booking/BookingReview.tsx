import { useEffect, useRef } from "react";
import type { Booking } from "./bookingModel";
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
    <section aria-busy={pending}>
      <h1 ref={heading} tabIndex={-1}>
        Проверьте заказ
      </h1>
      <BookingSummary booking={booking} />
      <p>Контактный email: {booking.email}</p>
      {error && (
        <p ref={errorMessage} tabIndex={-1} role="alert" className="error">
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
          <button type="submit" disabled={pending}>
            {pending ? "Подтверждаем…" : "Подтвердить заказ"}
          </button>
        </div>
      </form>
      <p ref={status} tabIndex={-1} role="status">
        {pending ? "Подтверждаем демонстрационный заказ." : ""}
      </p>
    </section>
  );
}
