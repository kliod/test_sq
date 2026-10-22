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
    <section className={`result-screen result-${props.kind}`}>
      <div className="result-banner">
        <p className="eyebrow">
          {props.kind === "success"
            ? "Демонстрационный результат"
            : "Подтверждение недоступно"}
        </p>
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
      </div>
      <div className="review-card">
        <BookingSummary booking={props.booking} />
        <p className="contact-value">
          <span className="muted">Контактный email</span>
          <strong>{props.booking.email}</strong>
        </p>
      </div>
      {props.kind === "soldOut" && (
        <div className="actions">
          <button type="button" onClick={props.onEdit}>
            Изменить данные
          </button>
          <button className="primary" type="button" onClick={props.onRetry}>
            Повторить проверку
          </button>
        </div>
      )}
    </section>
  );
}
