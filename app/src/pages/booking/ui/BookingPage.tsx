import type { ComponentProps, FormEventHandler, RefObject } from "react";
import type { BookingFormValues } from "../model/bookingModel";
import type { BookingFlowState } from "../model/bookingSlice";
import BookingForm from "./BookingForm";
import BookingSummary from "./BookingSummary";
import BookingReview from "./BookingReview";
import BookingResult from "./BookingResult";

type Props = {
  flow: BookingFlowState;
  editing: ComponentProps<typeof BookingForm> & {
    values: BookingFormValues;
    headingRef: RefObject<HTMLHeadingElement | null>;
    onSubmit: FormEventHandler<HTMLFormElement>;
  };
  onEdit: () => void;
  onConfirm: () => void;
};

export default function BookingPage({
  flow,
  editing,
  onEdit,
  onConfirm,
}: Props) {
  const { values, headingRef, onSubmit, ...formProps } = editing;
  return (
    <main>
      <p>Вечер открытий — демонстрационное мероприятие</p>
      {flow.step === "success" && flow.reviewedBooking && flow.reference ? (
        <BookingResult
          kind="success"
          booking={flow.reviewedBooking}
          reference={flow.reference}
        />
      ) : flow.step === "soldOut" && flow.reviewedBooking ? (
        <BookingResult
          kind="soldOut"
          booking={flow.reviewedBooking}
          onEdit={onEdit}
          onRetry={onConfirm}
        />
      ) : (flow.step === "review" || flow.step === "submitting") &&
        flow.reviewedBooking ? (
        <BookingReview
          booking={flow.reviewedBooking}
          onEdit={onEdit}
          onConfirm={onConfirm}
          pending={flow.step === "submitting"}
          error={flow.submitError}
        />
      ) : (
        <>
          <h1 ref={headingRef} tabIndex={-1}>
            Оформление билетов
          </h1>
          <p>
            Детский билет — 1 000 руб. (младше 14 лет), полный — 2 000 руб. (от
            14 лет).
          </p>
          <form noValidate onSubmit={onSubmit}>
            <p role="alert">
              {Object.keys(formProps.errors).length > 0
                ? "Проверьте данные — исправьте ошибки, указанные рядом с полями и участниками."
                : ""}
            </p>
            <BookingForm {...formProps} />
            <BookingSummary values={values} />
            <button type="submit">Проверить заказ</button>
          </form>
        </>
      )}
      <p>Это демонстрация. Оплата и реальное бронирование не выполняются.</p>
    </main>
  );
}
