# Технические контракты и последовательность данных

## Структура приложения

```text
app/
  package.json
  README.md                     # Создается при финальной поставке
  docs/UI_SYSTEM.md             # Итог задачи 02
  docs/SKILL_USAGE.md           # Подтверждение обращения к скиллу
  src/
    main.tsx                   # Тонкий вход через app/index.ts
    app/
      index.ts                 # Подключение приложения и глобального CSS
      App.tsx                  # Единственный владелец useForm и inFlightRef; dispatch переходов
      providers/AppProviders.tsx # Один Provider; в тестах принимает отдельный store
      store/
        store.ts               # configureStore, фабрика store, RootState, AppDispatch
        hooks.ts               # Типизированные useAppDispatch/useAppSelector
        selectors.ts           # Корневые селекторы с RootState
        bookingIntegration.test.tsx # Связи Provider/store/страницы/сервиса через SSR
      styles/styles.css        # Один основной источник визуальных стилей
    pages/booking/
      index.ts                 # Явный публичный API для app
      model/
        bookingSlice.ts        # Redux Toolkit: состояние сценария и переходы
        bookingSlice.test.ts   # Допустимые переходы и защита инвариантов
        bookingModel.ts        # Чистые типы, валидация, тарифы, сравнение
        bookingModel.test.ts
      api/
        bookingService.ts      # Mock-сервис, режимы и типы результата
      ui/
        BookingPage.tsx        # Представление текущего шага, данные и обработчики через props
        BookingForm.tsx        # Участники и общий email
        BookingSummary.tsx     # Сводка из формы либо Booking
        BookingReview.tsx      # Нередактируемая проверка нормализованного Booking
        BookingResult.tsx      # Успех или отказ
```

Не нужно создавать каждую необязательную папку или файл заранее. Названия выше задают владельцев ответственности. `ParticipantFields.tsx` можно выделить из `BookingForm`, если уменьшает повторение, но не делать библиотеку компонентов.

Сборка приложения находится в слое `app`, сценарий целиком — в слайсе `pages/booking`. Внешние потребители используют его `index.ts`; внутренние файлы используют прямые относительные импорты. `pages/booking` не импортирует store, hooks или `RootState` из `app`, включая типы и тесты. Подробные границы — в [DECOMPOSITION.md](DECOMPOSITION.md).

## Типы и контракт чистой модели

```ts
type ParticipantFields = { name: string; age: string };
type BookingFormValues = { participants: ParticipantFields[]; email: string };
type Participant = { name: string; age: number };
type Booking = { participants: Participant[]; email: string };

type ValidationErrors = {
  participants?: Array<{ name?: string; age?: string }>;
  group?: string;
  email?: string;
  form?: string;
};

type ValidationResult =
  | { ok: true; booking: Booking }
  | { ok: false; errors: ValidationErrors };

type ConfirmResult =
  | { kind: 'success'; reference: string }
  | { kind: 'soldOut' };

type BookingService = { confirm(booking: Booking): Promise<ConfirmResult> };
type BookingStep = 'editing' | 'review' | 'submitting' | 'success' | 'soldOut';
```

Функции `parseAge(raw: string): number | null`, `validateAndNormalize(values): ValidationResult`, `getTicketPrice(age: number): number`, `calculateTotal(participants: Participant[]): number`, `hasRequiredAdult(participants: Participant[]): boolean`, `isSameBooking(a: Booking, b: Booking): boolean`.

Разрешена аналогичная явная структура ошибок, если все поля/группа однозначно отображаются в UI. Изменение согласовать через отчет задачи 01. Для `parseAge` допустима только последовательность десятичных цифр после `trim()`, затем `Number` + `Number.isSafeInteger`. `Number('')`, `parseInt('13.5')` и слепое `z.coerce.number()` запрещены.

Если в задаче 03 выбран Zod, он не должен создавать вторую независимую версию правил. Чистые функции модели остаются источником истины. Можно использовать явный валидатор + `setError` из React Hook Form без Zod.

## Владение формой

- Один `useForm<BookingFormValues>` в постоянно смонтированном `App`, `shouldUnregister: false`.
- Один `useFieldArray` на постоянном уровне для `participants`; использовать `field.id` как React key, **не индекс**. Не добавлять ID в `Booking` ради UI.
- Изменения в полях и ошибки ввода хранятся только в RHF. `useWatch` дает превью. Не хранить второй редактируемый черновик через `useState` или Redux и не синхронизировать каждое изменение поля со store.
- Для `editing` цена извлекается из `parseAge`, не считается финальной при ошибочных возрастах.
- После успешной проверки формируется **новый нормализованный снимок** `reviewedBooking` (имена/email после `trim`, возраста number). Экран `review` читает только снимок.
- После возврата к редактированию данные RHF сохраняются. Следующий переход на review создает новый снимок.

## Redux Toolkit: состояние сценария

Пути в этом разделе указаны от `app/src/`.

Базовый менеджер состояния — **Redux Toolkit** (`@reduxjs/toolkit`) с React Redux (`react-redux`). Один `configureStore` создается вне рендера в `app/store/store.ts`; `Provider` подключается через `app/providers/AppProviders.tsx` в `main.tsx`. `RootState` и `AppDispatch` выводятся из store; типизированные `useAppSelector` и `useAppDispatch` использует `App`, а `BookingPage` получает данные и обработчики через props. Корневые селекторы с `RootState` находятся в `app/store/selectors.ts`; reducer не зависит от корневого типа приложения. Для тестов фабрика создает отдельный store на каждый запуск, `AppProviders` принимает его через prop. Основа настройки — [официальная документация Redux Toolkit](https://redux-toolkit.js.org/usage/usage-with-typescript/).

`bookingSlice.ts` через `createSlice` владеет только сериализуемым состоянием:

```ts
type BookingFlowState = {
  step: BookingStep;
  reviewedBooking: Booking | null;
  submitError: string | null;
  reference: string | null;
};
// initialState: editing, остальные поля null.
```

- Шаг, снимок, техническая ошибка и номер результата не дублируются в локальном React state. Стоимость вычисляется чистой моделью из формы или снимка; сумма и тарифы не хранятся в Redux.
- Переход на review одним action сохраняет новый валидированный снимок и очищает старую ошибку/номер. Возврат в editing очищает снимок и результат, сохраняя RHF. Повтор из soldOut использует прежний снимок; начало попытки очищает ошибку/номер.
- `success` требует снимка и номера; `soldOut` — снимка без номера; техническая ошибка возвращает в review с тем же снимком и текстом ошибки. Недопустимые события не меняют состояние, особенно редактирование во время submitting.
- `App` валидирует `getValues()`, сравнивает снимок, синхронно устанавливает `inFlightRef`, dispatch начала попытки, вызывает сервис вне reducer и dispatch результата/ошибки. Guard снимается в `finally`. Reducer не содержит побочных эффектов; refs, Promise, сервисы, функции и Error не попадают в state/actions. Ошибка передается строкой.
- RTK Query, persistence и второй store не нужны. Ввод и персональные данные остаются в памяти; перезагрузка страницы сбрасывает состояние. Если добавляется явный сброс заказа, одновременно сбрасываются RHF и slice.

## Допустимые переходы сценария

```text
editing --(валидно)--> review --(snapshot актуален)--> submitting
   ^                       |                              |   |     \
   |                       |                         success soldOut reject
   +---- Изменить ----------+                              |      |     \
   ^                                                      success soldOut review
   +------------------- Изменить данные ----------------------------+
```

Схема иллюстративная. Формальные переходы:

| Из | Событие | В | Требование |
|---|---|---|---|
| editing | Проверить, все валидно | review | Создать snapshot |
| editing | Проверить, ошибка | editing | Сообщения и фокус |
| review | Изменить | editing | Сохранить форму |
| review | Подтвердить | submitting | Снова проверить `getValues`, сверить с snapshot, затем guard |
| review | Изменения/невалидность | editing | Ничего не отправлять |
| submitting | success | success | Условный номер |
| submitting | soldOut | soldOut | Номер отсутствует |
| submitting | reject | review | Техническая ошибка, можно повторить |
| soldOut | Изменить | editing | Данные сохранены |
| soldOut | Повторить | submitting | Новый контролируемый вызов; forced mode повторно откажет |

Во время `submitting` нет редактирования и переходов назад. `inFlightRef.current` устанавливается синхронно до вызова сервиса и снимается в `finally`. UI `disabled` является дополнительной, но не единственной защитой. Для состояния `soldOut` повтор использует тот же зафиксированный снимок, который прошел валидацию и показывался на review.

Скрин результата не должен сообщать об оплате, отправке email или реальном бронировании.

## Mock API

Один `confirm(booking: Booking): Promise<ConfirmResult>`, небольшая задержка (например 450-750 мс), без случайного исхода и фальшивой серверной емкости. Считать режим один раз при инициализации по `location.search`:

- без параметра: `{ kind: 'success', reference: 'DEMO-001' }`;
- `?scenario=sold-out`: `{ kind: 'soldOut' }`.

Технический `Promise.reject` эмулируется подставным сервисом в тесте, а не дополнительной UI-кнопкой в production-сценарии. Контракт сервисной границы не обещает production-идемпотентность.
