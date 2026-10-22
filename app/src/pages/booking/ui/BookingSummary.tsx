import {
  calculateTotal,
  FULL_TICKET_MIN_AGE,
  getTicketPrice,
  parseAge,
} from "../model/bookingModel";
import type {
  Booking,
  BookingFormValues,
  Participant,
} from "../model/bookingModel";

const money = (value: number) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);

type Props =
  | { booking: Booking; values?: never }
  | { values: BookingFormValues; booking?: never };
export default function BookingSummary(props: Props) {
  const people = props.booking
    ? props.booking.participants
    : props.values.participants.map((person) => ({
        name: person.name,
        age: parseAge(person.age),
      }));
  const complete =
    people.length > 0 && people.every((person) => person.age !== null);
  return (
    <section className="booking-summary" aria-labelledby="summary-heading">
      <h2 id="summary-heading">Состав и стоимость</h2>
      <ul>
        {people.map((person, index) => (
          <li className="summary-person" key={index}>
            <div>
              <strong>{person.name.trim() || "Участник " + (index + 1)}</strong>
              {person.age === null ? (
                <span className="person-detail">Укажите возраст</span>
              ) : (
                <>
                  <span className="person-detail">
                    Возраст: {person.age};{" "}
                    {person.age < FULL_TICKET_MIN_AGE ? "детский" : "полный"}{" "}
                    тариф
                  </span>
                </>
              )}
            </div>
            {person.age !== null && (
              <span className="person-price">
                {money(getTicketPrice(person.age))}
              </span>
            )}
          </li>
        ))}
      </ul>
      {complete ? (
        <p className="summary-total">
          <span>Итого</span>
          <strong>{money(calculateTotal(people as Participant[]))}</strong>
        </p>
      ) : (
        <p className="incomplete-total">
          Итог уточняется — укажите корректный возраст каждого участника.
        </p>
      )}
    </section>
  );
}
