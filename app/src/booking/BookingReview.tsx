import { useEffect, useRef } from "react";
import type { Booking } from "./bookingModel";
import BookingSummary from "./BookingSummary";

export default function BookingReview({
  booking,
  onEdit,
}: {
  booking: Booking;
  onEdit: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  return (
    <>
      <h1 ref={heading} tabIndex={-1}>
        Проверьте заказ
      </h1>
      <BookingSummary booking={booking} />
      <p>Контактный email: {booking.email}</p>
      <div className="actions">
        <button type="button" onClick={onEdit}>
          Изменить
        </button>
        <button type="button" disabled aria-describedby="confirm-help">
          Подтвердить заказ
        </button>
      </div>
      <p id="confirm-help">
        Подтверждение пока недоступно — этот шаг находится в разработке.
      </p>
    </>
  );
}
