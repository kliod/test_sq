export type ParticipantFields = { name: string; age: string };
export type BookingFormValues = { participants: ParticipantFields[]; email: string };
export type Participant = { name: string; age: number };
export type Booking = { participants: Participant[]; email: string };
export type ValidationErrors = {
  participants?: Array<{ name?: string; age?: string }>;
  group?: string;
  email?: string;
  form?: string;
};
export type ValidationResult = { ok: true; booking: Booking } | { ok: false; errors: ValidationErrors };

export const MIN_PARTICIPANTS = 1;
export const MAX_PARTICIPANTS = 4;
export const FULL_TICKET_MIN_AGE = 14;
export const ADULT_MIN_AGE = 18;
export const CHILD_PRICE = 1000;
export const FULL_PRICE = 2000;

export function parseAge(raw: string): number | null {
  const value = raw.trim();
  if (!/^[0-9]+$/.test(value)) return null;
  const age = Number(value);
  return Number.isSafeInteger(age) && age >= 0 ? age : null;
}

// Принимает только проверенный возраст.
export const getTicketPrice = (age: number): number =>
  age < FULL_TICKET_MIN_AGE ? CHILD_PRICE : FULL_PRICE;

export const calculateTotal = (participants: Participant[]): number =>
  participants.reduce((total, person) => total + getTicketPrice(person.age), 0);

export const hasRequiredAdult = (participants: Participant[]): boolean =>
  !participants.some(({ age }) => age < FULL_TICKET_MIN_AGE) ||
  participants.some(({ age }) => age >= ADULT_MIN_AGE);

export function validateAndNormalize(values: BookingFormValues): ValidationResult {
  const errors: ValidationErrors = {};
  if (values.participants.length < MIN_PARTICIPANTS || values.participants.length > MAX_PARTICIPANTS) {
    errors.form = 'В заказе должно быть от 1 до 4 участников.';
  }
  const participants: Participant[] = [];
  const fieldErrors = values.participants.map((person) => {
    const error: { name?: string; age?: string } = {};
    const name = person.name.trim();
    const age = parseAge(person.age);
    if (!name) error.name = 'Укажите имя участника.';
    if (age === null) error.age = 'Укажите целый неотрицательный возраст цифрами.';
    if (name && age !== null) participants.push({ name, age });
    return error;
  });
  if (fieldErrors.some((error) => error.name || error.age)) errors.participants = fieldErrors;
  const email = values.email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Укажите корректный email.';
  if (values.participants.every((person) => parseAge(person.age) !== null) &&
      !hasRequiredAdult(values.participants.map((person) => ({ name: person.name.trim(), age: parseAge(person.age)! })))) {
    errors.group = 'Для ребенка младше 14 лет добавьте участника от 18 лет.';
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, booking: { participants, email } };
}

export function isSameBooking(a: Booking, b: Booking): boolean {
  return a.email === b.email && a.participants.length === b.participants.length &&
    a.participants.every((person, index) =>
      person.name === b.participants[index].name && person.age === b.participants[index].age);
}
