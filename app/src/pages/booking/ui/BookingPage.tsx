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
  const currentStep =
    flow.step === "editing"
      ? 0
      : flow.step === "review" || flow.step === "submitting"
        ? 1
        : 2;
  const errorLinks = formProps.fields.flatMap((field, index) =>
    (["name", "age"] as const).flatMap((key) => {
      const message = formProps.errors.participants?.[index]?.[key]?.message;
      return message
        ? [
            {
              id: `${field.id}-${key}`,
              text: `Участник ${index + 1}: ${message}`,
            },
          ]
        : [];
    }),
  );
  if (formProps.errors.email?.message)
    errorLinks.push({ id: "email", text: formProps.errors.email.message });
  if (formProps.errors.root?.group?.message)
    errorLinks.push({
      id: "participants-heading",
      text: formProps.errors.root.group.message,
    });
  if (formProps.errors.root?.form?.message)
    errorLinks.push({
      id: "participants-heading",
      text: formProps.errors.root.form.message,
    });
  return (
    <main>
      <header className="event-header">
        <p className="eyebrow">Вечер открытий</p>
        <p className="muted">Демонстрационное мероприятие</p>
      </header>
      <ol className="steps" aria-label="Этапы оформления">
        {["Данные", "Проверка", "Результат"].map((label, index) => (
          <li
            key={label}
            aria-current={currentStep === index ? "step" : undefined}
          >
            <span className="step-number" aria-hidden="true">
              {index + 1}
            </span>
            {label}
          </li>
        ))}
      </ol>
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
          <p className="tariff-help">
            Детский билет — 1 000 руб. (младше 14 лет), полный — 2 000 руб. (от
            14 лет).
          </p>
          <form className="checkout-grid" noValidate onSubmit={onSubmit}>
            <div className="error-summary" role="alert">
              {errorLinks.length > 0 && (
                <>
                  <h2>Проверьте данные</h2>
                  <ul>
                    {errorLinks.map(({ id, text }, index) => (
                      <li key={`${id}-${index}`}>
                        <a
                          href={`#${id}`}
                          onClick={(event) => {
                            event.preventDefault();
                            document.getElementById(id)?.focus();
                          }}
                        >
                          {text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
            <div className="booking-details">
              <BookingForm {...formProps} />
            </div>
            <div className="order-panel">
              <BookingSummary values={values} />
              <button className="primary" type="submit">
                Проверить заказ
              </button>
              <p className="action-help">
                На следующем шаге можно проверить и изменить данные.
              </p>
            </div>
          </form>
        </>
      )}
      <footer className="demo-note">
        Это демонстрация. Оплата, реальное бронирование и отправка билетов не
        выполняются.
      </footer>
    </main>
  );
}
