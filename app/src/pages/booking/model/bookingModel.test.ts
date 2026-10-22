import { describe, expect, it } from 'vitest';
import { calculateTotal, getTicketPrice, hasRequiredAdult, isSameBooking, parseAge, validateAndNormalize } from './bookingModel';
import type { Booking, BookingFormValues } from './bookingModel';

const form = (...ages: string[]): BookingFormValues => ({
  participants: ages.map((age, index) => ({ name: 'Участник ' + index, age })),
  email: ' user@example.com ',
});
const people = (...ages: number[]) => ages.map((age) => ({ name: 'Имя', age }));
function valid(ages: string[], total: number) {
  const result = validateAndNormalize(form(...ages));
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error('Ожидался валидный заказ');
  expect(calculateTotal(result.booking.participants)).toBe(total);
  return result.booking;
}
function groupError(...ages: string[]) {
  const result = validateAndNormalize(form(...ages));
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error('Ожидалась ошибка');
  expect(result.errors.group).toBeTruthy();
  expect(result).not.toHaveProperty('booking');
}
describe('M01–M16 — модель заказа', () => {
  it('M01 — нужен хотя бы один участник', () => {
    expect(validateAndNormalize(form())).toMatchObject({ ok: false, errors: { form: expect.any(String) } });
  });
  it('M02 — 18 лет и нормализация без изменения формы', () => {
    const input = form(' 18 ');
    input.participants[0].name = '  Анна  ';
    const result = validateAndNormalize(input);
    expect(result).toEqual({ ok: true, booking: { participants: [{ name: 'Анна', age: 18 }], email: 'user@example.com' } });
    expect(input.participants[0].name).toBe('  Анна  ');
    valid(['18'], 2000);
  });
  it('M03 — 13 лет, детский тариф и ошибка сопровождения', () => {
    expect(getTicketPrice(13)).toBe(1000); groupError('13');
  });
  it('M04 — 14 лет, полный тариф', () => { valid(['14'], 2000); });
  it('M05 — 17 лет без ребенка допустимы', () => { valid(['17'], 2000); });
  it('M06 — 13+17: 3000, сопровождения нет', () => {
    groupError('13', '17'); expect(calculateTotal(people(13, 17))).toBe(3000);
    expect(hasRequiredAdult(people(13, 17))).toBe(false);
  });
  it('M07 — 13+18: 3000', () => { valid(['13', '18'], 3000); });
  it('M08 — 13+13+18: 4000', () => { valid(['13', '13', '18'], 4000); });
  it('M09 — 14+17: 4000, взрослый не требуется', () => { valid(['14', '17'], 4000); });
  it('M10 — четыре допустимы, пять нет', () => {
    valid(['18', '13', '14', '17'], 7000);
    expect(validateAndNormalize(form('18', '18', '18', '18', '18'))).toMatchObject({ ok: false, errors: { form: expect.any(String) } });
  });
  it('M11 — ошибочный возраст адресуется нужному участнику', () => {
    for (const raw of ['', '  ', '-1', '13.5', 'abc', 'Infinity', '1e2', '+13', '0x10']) {
      expect(parseAge(raw)).toBeNull();
      expect(validateAndNormalize(form('18', raw))).toMatchObject({ ok: false, errors: { participants: [{}, { age: expect.any(String) }] } });
    }
  });
  it('M12 — ноль допустим, но требует взрослого', () => {
    expect(parseAge('0')).toBe(0); expect(getTicketPrice(0)).toBe(1000);
    groupError('0'); valid(['0', '18'], 3000);
  });
  it('M13 — пустое имя и ошибочный email', () => {
    const input = form('18'); input.participants[0].name = '  '; input.email = 'no-address';
    expect(validateAndNormalize(input)).toMatchObject({ ok: false, errors: { participants: [{ name: expect.any(String) }], email: expect.any(String) } });
    const shortName = form('18'); shortName.participants[0].name = 'A';
    expect(validateAndNormalize(shortName).ok).toBe(true);
  });
  it('M14 — изменение 13 на 14 пересчитывает тариф и итог', () => {
    const input = form('13', '18');
    const before = validateAndNormalize(input);
    input.participants[0].age = '14';
    const after = validateAndNormalize(input);
    if (!before.ok || !after.ok) throw new Error('Ожидались валидные заказы');
    expect(calculateTotal(before.booking.participants)).toBe(3000);
    expect(calculateTotal(after.booking.participants)).toBe(4000);
  });
  it('M15 — граница safe integer без произвольного потолка', () => {
    expect(parseAge(String(Number.MAX_SAFE_INTEGER))).toBe(Number.MAX_SAFE_INTEGER);
    expect(parseAge('9007199254740992')).toBeNull();
    expect(parseAge('9'.repeat(400))).toBeNull();
    valid([String(Number.MAX_SAFE_INTEGER)], 2000);
    expect(validateAndNormalize(form('9007199254740992')).ok).toBe(false);
  });
  it('M16 — сравнение email, длины, порядка, имен и возрастов', () => {
    const booking = valid(['13', '18'], 3000);
    const clone = (): Booking => structuredClone(booking);
    expect(isSameBooking(booking, clone())).toBe(true);
    const changed: Booking[] = [];
    let other = clone(); other.email = 'other@example.com'; changed.push(other);
    other = clone(); other.participants.pop(); changed.push(other);
    other = clone(); other.participants.reverse(); changed.push(other);
    other = clone(); other.participants[0].name = 'Другое имя'; changed.push(other);
    other = clone(); other.participants[0].age = 14; changed.push(other);
    for (const value of changed) expect(isSameBooking(booking, value)).toBe(false);
  });
});
