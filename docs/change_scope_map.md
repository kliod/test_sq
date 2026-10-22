# Карта границ изменений SQOCH

Владелец доменных правил — `docs/spec/` и `bookingModel.ts`, владелец состояния сценария — Redux Toolkit `bookingSlice.ts`; `App.tsx` владеет RHF и локальным inFlightRef и координирует dispatch. Настоящий сервер отсутствует. **Можно читать смежные файлы, но редактировать только пути своей текущей задачи.**

| Задача | Основной модуль | Разрешенные изменения | Только читать | Проверка по риску |
|---|---|---|---|---|
| 00 | Bootstrap | `app/package.json`, lockfile, конфигурация Vite/TS, `app/index.html`, `app/src/main.tsx`, `app/src/App.tsx`, стартовый CSS, файлы стандартного шаблона | `docs/spec/**`, `docs/tasks/**` | `npm run build`, запуск dev при доступности |
| 01 | Domain | `app/src/booking/bookingModel.ts`, `bookingModel.test.ts`, минимальный `app/package.json` | `docs/spec/**`, UI | `npm run test -- bookingModel` (или фактическая команда runner), сборка при изменении типов/entrypoints |
| 02 | Design research | `app/docs/UI_SYSTEM.md`, `app/docs/SKILL_USAGE.md` | `docs/spec/**`, код, локальный `SKILL.md` | Проверка полноты документа; кодовые тесты не нужны, если не менялся код |
| 03 | UI editing/review | `app/src/App.tsx`, `app/src/booking/BookingForm.tsx`, `BookingSummary.tsx`, `BookingReview.tsx`, минимально `app/src/styles.css` | Domain, сервис, `docs/spec/**` | Целевой UI smoke (если доступен), typecheck/build при TS-правках; доменный unit только если затронут контракт |
| 04 | Booking orchestration | `app/src/App.tsx`, `app/src/booking/bookingService.ts`, `BookingResult.tsx`, `BookingReview.tsx`, минимально `BookingSummary.tsx`/`styles.css` | Domain, `docs/spec/**` | Интеграционные U03/U04 при наличии тестовой среды; узкий smoke success/sold-out; сборка TS |
| 05 | Styling | `app/src/styles.css`, презентационные JSX/classes в `App.tsx` и четырех booking-компонентах, `app/docs/{UI_SYSTEM,SKILL_USAGE}.md` | Domain, сервис, контракты | Визуальная проверка desktop/360 px, keyboard; сборка при JSX-правках, релевантный UI smoke |
| 06 | QA/delivery | `app/README.md`, тесты, точечные исправления **подтвержденных** дефектов в модуле-владельце | Весь `app/`, `docs/spec/**` | Полная доменная матрица, build, сквозные сценарии, контроль README и материалов сдачи |

Если в задаче перечислены пути из нескольких строк карты, текущая задача **уже разрешает** такое пересечение; повторного разрешения на эти пути не нужно. Любое **новое** пересечение, изменение `docs/spec/`, внешняя установка или исходники за пределами `app/` требуют отдельного согласования.

Обязательные пути Redux Toolkit дополняют строки карты:

- 00: `app/src/state/store.ts`, `app/src/state/hooks.ts`, `app/src/booking/bookingSlice.ts` (начальное состояние), Provider в `app/src/main.tsx`, пакеты `@reduxjs/toolkit` и `react-redux` в package/lockfile после согласования команды установки.
- 03: те же store/hooks и `app/src/booking/bookingSlice.ts`, `bookingSlice.test.ts` — переходы editing/review, селекторы и S01/S02.
- 04: slice и его тесты, минимально store/hooks — submitting, результаты, ошибка и запрещенные переходы, S02/S03.
- 06: финальная проверка S01-S03 вместе с доменной матрицей и пользовательскими сценариями.

## Источники истины

- Обязательные продуктовые правила: `docs/spec/REQUIREMENTS.md`.
- Контракты приложения: `docs/spec/CONTRACTS.md`; реализация модели: `app/src/booking/bookingModel.ts` после задачи 01.
- Нормализованный заказ/проверка: `bookingModel.ts`; форма: один `useForm` в `App.tsx`; UI не создает альтернативных бизнес-правил.
- Состояние сценария: `bookingSlice.ts`; настройка store и типизированные hooks: `state/store.ts` и `state/hooks.ts`. Редактируемая форма и вычисляемые цены в store не копируются.
- Реакции mock-сервиса: `bookingService.ts`; отображение: компоненты; стили: `styles.css` по `app/docs/UI_SYSTEM.md`.
- Приемка: `docs/spec/ACCEPTANCE.md`. Описание теста не доказывает прохождение теста.

## Изменение публичного контракта

1. Назови владельца и точный пункт `docs/spec/CONTRACTS.md` или `docs/spec/REQUIREMENTS.md`.
2. Опиши, почему невозможно решить проблему в текущем контракте и какие потребители затронуты.
3. Попроси явное решение человека **до** правки `docs/spec/`; не меняй требования под код.
4. После согласования правь источник, затем модель/потребителей и только после этого тесты; фиксируй в kaeru.

## Шаблон запроса расширения

```text
Текущая задача: NN
Модуль-владелец: ...
Текущий разрешенный scope: ...
Новый нужный путь: ...
Причина: ...
Какой контракт затрагивается: ...
Минимальное изменение: ...
Проверка интеграции: ...
Статус согласования: ожидается/получено
```

Запреты: не переписывать соседний модуль без причины; не вводить новые DTO ради обхода существующих; не запускать массовое форматирование; не считать доступ на чтение правом редактирования.
