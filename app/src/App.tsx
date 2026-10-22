import { useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import BookingForm from "./booking/BookingForm";
import BookingSummary from "./booking/BookingSummary";
import BookingResult from "./booking/BookingResult";
import { createBookingService } from "./booking/bookingService";
import type { BookingService } from "./booking/bookingService";
import BookingReview from "./booking/BookingReview";
import {
  MAX_PARTICIPANTS,
  MIN_PARTICIPANTS,
  validateAndNormalize,
  isSameBooking,
} from "./booking/bookingModel";
import type { BookingFormValues } from "./booking/bookingModel";
import {
  editBooking,
  startConfirmation,
  confirmationFinished,
  confirmationFailed,
  reviewBooking,
  selectBookingFlow,
} from "./booking/bookingSlice";
import { useAppDispatch, useAppSelector } from "./state/hooks";

export default function App({ service }: { service?: BookingService } = {}) {
  const serviceRef = useRef<BookingService | null>(null);
  if (!serviceRef.current)
    serviceRef.current =
      service ?? createBookingService(window.location.search);
  const inFlightRef = useRef(false);
  const {
    register,
    control,
    getValues,
    setError,
    clearErrors,
    setFocus,
    formState: { errors },
  } = useForm<BookingFormValues>({
    defaultValues: { participants: [{ name: "", age: "" }], email: "" },
    shouldUnregister: false,
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "participants",
  });
  const values = useWatch({ control }) as BookingFormValues;
  const flow = useAppSelector(selectBookingFlow);
  const dispatch = useAppDispatch();
  const editingHeading = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(flow.step);
  const pendingFocus = useRef<number | null>(null);

  useEffect(() => {
    if (previousStep.current !== flow.step && flow.step === "editing")
      editingHeading.current?.focus();
    previousStep.current = flow.step;
  }, [flow.step]);
  useEffect(() => {
    if (pendingFocus.current !== null) {
      setFocus(`participants.${pendingFocus.current}.name`);
      pendingFocus.current = null;
    }
  }, [fields, setFocus]);

  function returnToEditing() {
    if (inFlightRef.current) return;
    dispatch(editBooking());
  }
  async function confirmOrder() {
    if (
      inFlightRef.current ||
      (flow.step !== "review" && flow.step !== "soldOut") ||
      !flow.reviewedBooking
    )
      return;
    const current = validateAndNormalize(getValues());
    if (!current.ok || !isSameBooking(current.booking, flow.reviewedBooking)) {
      dispatch(editBooking());
      setError("root.form", {
        message: "Данные изменились. Проверьте заказ еще раз.",
      });
      return;
    }
    inFlightRef.current = true;
    dispatch(startConfirmation());
    try {
      const result = await serviceRef.current!.confirm(flow.reviewedBooking);
      dispatch(confirmationFinished(result));
    } catch {
      dispatch(
        confirmationFailed("Не удалось проверить заказ. Попробуйте еще раз."),
      );
    } finally {
      inFlightRef.current = false;
    }
  }
  function checkOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlightRef.current || flow.step !== "editing") return;
    clearErrors();
    const result = validateAndNormalize(getValues());
    if (result.ok) {
      dispatch(reviewBooking(result.booking));
      return;
    }
    let firstField:
      | "email"
      | `participants.${number}.name`
      | `participants.${number}.age`
      | undefined;
    result.errors.participants?.forEach((person, index) => {
      for (const key of ["name", "age"] as const) {
        if (person[key]) {
          const path = `participants.${index}.${key}` as const;
          setError(path, { type: "validate", message: person[key] });
          firstField ??= path;
        }
      }
    });
    if (result.errors.email) {
      setError("email", { type: "validate", message: result.errors.email });
    }
    if (result.errors.group)
      setError("root.group", { message: result.errors.group });
    if (result.errors.form)
      setError("root.form", { message: result.errors.form });
    // Фокус на первой ошибке согласно gate задачи 03.
    if (firstField) setFocus(firstField);
    else if (result.errors.group || result.errors.form)
      document.getElementById("participants-heading")?.focus();
    else if (result.errors.email) setFocus("email");
  }
  function addParticipant() {
    if (
      inFlightRef.current ||
      flow.step !== "editing" ||
      fields.length >= MAX_PARTICIPANTS
    )
      return;
    clearErrors();
    append(
      { name: "", age: "" },
      { focusName: `participants.${fields.length}.name` },
    );
  }
  function removeParticipant(index: number) {
    if (
      inFlightRef.current ||
      flow.step !== "editing" ||
      fields.length <= MIN_PARTICIPANTS
    )
      return;
    pendingFocus.current = Math.min(index, fields.length - 2);
    remove(index);
    clearErrors();
  }
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
          onEdit={returnToEditing}
          onRetry={confirmOrder}
        />
      ) : (flow.step === "review" || flow.step === "submitting") &&
        flow.reviewedBooking ? (
        <BookingReview
          booking={flow.reviewedBooking}
          onEdit={returnToEditing}
          onConfirm={confirmOrder}
          pending={flow.step === "submitting"}
          error={flow.submitError}
        />
      ) : (
        <>
          <h1 ref={editingHeading} tabIndex={-1}>
            Оформление билетов
          </h1>
          <p>
            Детский билет — 1 000 руб. (младше 14 лет), полный — 2 000 руб. (от
            14 лет).
          </p>
          <form noValidate onSubmit={checkOrder}>
            <p role="alert">
              {Object.keys(errors).length > 0
                ? "Проверьте данные — исправьте ошибки, указанные рядом с полями и участниками."
                : ""}
            </p>
            <BookingForm
              fields={fields}
              register={register}
              errors={errors}
              onAdd={addParticipant}
              onRemove={removeParticipant}
            />
            <BookingSummary values={values} />
            <button type="submit">Проверить заказ</button>
          </form>
        </>
      )}
      <p>Это демонстрация. Оплата и реальное бронирование не выполняются.</p>
    </main>
  );
}
