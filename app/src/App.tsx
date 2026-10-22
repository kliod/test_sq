import { useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import BookingForm from "./booking/BookingForm";
import BookingSummary from "./booking/BookingSummary";
import BookingReview from "./booking/BookingReview";
import {
  MAX_PARTICIPANTS,
  MIN_PARTICIPANTS,
  validateAndNormalize,
} from "./booking/bookingModel";
import type { BookingFormValues } from "./booking/bookingModel";
import {
  editBooking,
  reviewBooking,
  selectBookingFlow,
} from "./booking/bookingSlice";
import { useAppDispatch, useAppSelector } from "./state/hooks";

export default function App() {
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

  function checkOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    if (fields.length >= MAX_PARTICIPANTS) return;
    clearErrors();
    append(
      { name: "", age: "" },
      { focusName: `participants.${fields.length}.name` },
    );
  }
  function removeParticipant(index: number) {
    if (fields.length <= MIN_PARTICIPANTS) return;
    pendingFocus.current = Math.min(index, fields.length - 2);
    remove(index);
    clearErrors();
  }
  return (
    <main>
      <p>Вечер открытий — демонстрационное мероприятие</p>
      {flow.step === "review" && flow.reviewedBooking ? (
        <BookingReview
          booking={flow.reviewedBooking}
          onEdit={() => dispatch(editBooking())}
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
