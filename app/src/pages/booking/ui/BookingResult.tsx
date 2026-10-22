import { useEffect, useRef } from "react";
import type { Booking } from "../model/bookingModel";
import BookingSummary from "./BookingSummary";

type Props = { booking: Booking } & (
  | { kind: "success"; reference: string }
  | { kind: "soldOut"; onEdit: () => void; onRetry: () => void }
);
export default function BookingResult(props: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  return (
    <section>
      <h1 ref={heading} tabIndex={-1}>
        {props.kind === "success"
          ? "Тестовый заказ подтвержден"
          : "Места закончились. Заказ не оформлен"}
      </h1>
      {props.kind === "success" ? (
        <p>Условный номер: {props.reference}</p>
      ) : (
        <p>
          Данные сохранены. Повторная проверка не гарантирует появление мест.
        </p>
      )}
      <BookingSummary booking={props.booking} />
      <p>Контактный email: {props.booking.email}</p>
      {props.kind === "soldOut" && (
        <div className="actions">
          <button type="button" onClick={props.onEdit}>
            Изменить данные
          </button>
          <button type="button" onClick={props.onRetry}>
            Повторить проверку
          </button>
        </div>
      )}
    </section>
  );
}
