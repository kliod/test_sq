import type {
  FieldArrayWithId,
  FieldErrors,
  UseFormRegister,
} from "react-hook-form";
import { MAX_PARTICIPANTS, MIN_PARTICIPANTS } from "./bookingModel";
import type { BookingFormValues } from "./bookingModel";

type Props = {
  fields: FieldArrayWithId<BookingFormValues, "participants">[];
  register: UseFormRegister<BookingFormValues>;
  errors: FieldErrors<BookingFormValues>;
  onAdd: () => void;
  onRemove: (index: number) => void;
};
export default function BookingForm({
  fields,
  register,
  errors,
  onAdd,
  onRemove,
}: Props) {
  return (
    <>
      <section aria-labelledby="participants-heading">
        <h2
          id="participants-heading"
          tabIndex={-1}
          aria-describedby={errors.root?.group ? "group-error" : "group-help"}
        >
          Участники
        </h2>
        <p id="group-help">
          Если есть ребенок младше 14 лет, добавьте участника от 18 лет.
        </p>
        {fields.map((field, index) => {
          const nameError = errors.participants?.[index]?.name?.message;
          const ageError = errors.participants?.[index]?.age?.message;
          return (
            <fieldset key={field.id} aria-describedby="group-help">
              <legend>Участник {index + 1}</legend>
              <label htmlFor={field.id + "-name"}>Имя</label>
              <input
                id={field.id + "-name"}
                autoComplete="name"
                {...register(`participants.${index}.name`)}
                aria-invalid={!!nameError}
                aria-describedby={
                  nameError ? field.id + "-name-error" : undefined
                }
              />
              {nameError && (
                <p id={field.id + "-name-error"} className="error">
                  {nameError}
                </p>
              )}
              <label htmlFor={field.id + "-age"}>Возраст</label>
              <input
                id={field.id + "-age"}
                type="text"
                inputMode="numeric"
                {...register(`participants.${index}.age`)}
                aria-invalid={!!ageError}
                aria-describedby={
                  ageError ? field.id + "-age-error" : undefined
                }
              />
              {ageError && (
                <p id={field.id + "-age-error"} className="error">
                  {ageError}
                </p>
              )}
              <button
                type="button"
                disabled={fields.length <= MIN_PARTICIPANTS}
                aria-describedby={
                  fields.length <= MIN_PARTICIPANTS ? "minimum-help" : undefined
                }
                onClick={() => onRemove(index)}
              >
                Удалить участника {index + 1}
              </button>
            </fieldset>
          );
        })}
        {fields.length === MIN_PARTICIPANTS && (
          <p id="minimum-help">Нужен хотя бы один участник.</p>
        )}
        {errors.root?.group?.message && (
          <p id="group-error" className="error">
            {errors.root.group.message}
          </p>
        )}
        {errors.root?.form?.message && (
          <p className="error">{errors.root.form.message}</p>
        )}
        <p role="status">
          Участники: {fields.length} из {MAX_PARTICIPANTS}
        </p>
        <button
          type="button"
          onClick={onAdd}
          disabled={fields.length >= MAX_PARTICIPANTS}
          aria-describedby={
            fields.length >= MAX_PARTICIPANTS ? "maximum-help" : undefined
          }
        >
          Добавить участника
        </button>
        {fields.length >= MAX_PARTICIPANTS && (
          <p id="maximum-help">Максимум 4 участника.</p>
        )}
      </section>
      <section aria-labelledby="contact-heading">
        <h2 id="contact-heading">Контакт</h2>
        <label htmlFor="email">Email для всего заказа</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email?.message && (
          <p id="email-error" className="error">
            {errors.email.message}
          </p>
        )}
      </section>
    </>
  );
}
