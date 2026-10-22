# TASK 04 - Асинхронное подтверждение и результаты заказа

> **Единый процесс:** `AGENTS.md` -> `docs/WORKFLOW.md` -> `docs/spec/` -> `docs/change_scope_map.md` -> текущая задача -> релевантный код/тесты -> `docs/testing.md` -> `docs/templates/HANDOFF.md`. Модульные границы и согласование новых путей обязательны. Не повторяй уже пройденные проверки без новой регрессии; выполни все обязательные для текущего gate проверки, а недоступные явно пометь.


**Приоритет:** P0. **Зависимость:** TASK 03. **Блок:** orchestration, mock API, пять логических состояний и защита от неконсистентных данных.

## Контекст

Прочитай `docs/spec/CONTRACTS.md`, `docs/spec/ACCEPTANCE.md`, текущую реализацию `app/src/app/App.tsx` и bookingModel.ts, отчет TASK 03. UX уже определен, но окончательная CSS-полировка выполняется в TASK 05.

## Обязательное поведение

1. В `app/src/pages/booking/api/bookingService.ts` определить и реализовать BookingService.confirm(booking): Promise<ConfirmResult>. Режим считать один раз при инициализации: без query -> success, ?scenario=sold-out -> soldOut. Время задержки короткое и воспроизводимое; без случайных отказов.
2. Обеспечить пять логических состояний: editing | review | submitting | success | soldOut. submitting может визуально пользоваться экраном review; результат может быть одним общим компонентом.
3. Перед confirm **повторно** запустить validateAndNormalize(getValues()) и сравнить новый нормализованный объект с видимым reviewedBooking через isSameBooking. Если невалидно/отличается, ничего не отправлять; вернуться к редактированию с сообщением, что требуется повторная проверка.
4. До вызова Promise установить inFlightRef.current = true **синхронно**, после завершения или ошибки снять флаг в finally. Блокировка disabled на UI не заменяет guard. Во время submitting нельзя нажать Изменить, удалить участника или отправить еще один запрос.
5. success: показать Тестовый заказ подтвержден, условный DEMO-..., список участников и корректный итог. Не писать, что деньги списаны или билеты отправлены.
6. soldOut: показать Места закончились. Заказ не оформлен, без номера заказа, с действиями Изменить данные и Повторить проверку. Оба действия сохраняют RHF-данные. Повтор forced sold-out снова дает отказ и не обещает освобождения мест.
7. Неожиданный Promise.reject - **техническая ошибка**, а не soldOut. Вернуться на review, показать Не удалось проверить заказ. Попробуйте еще раз, разрешить повтор без потери снимка и данных. Для теста разрешить injection service или небольшую фабрику; для каждого теста создавать отдельный Redux store, не использовать общий singleton между тестами.
8. При завершении перевести фокус на заголовок результата; в pending сделать текст состояния доступным ( role=status или live region), не создавать дергающийся UI.
9. Удалить временную заглушку confirm из TASK 03. Код на review теперь реально вызывает сервис.

## Владение состояниями

 Redux Toolkit `bookingSlice.ts` владеет шагом, snapshot, строкой технической ошибки и reference успешного заказа. App.tsx читает селекторы, валидирует RHF, синхронно выставляет локальный inFlightRef, dispatch начала попытки, вызывает сервис вне reducer и dispatch результата/ошибки; guard снимает в finally. Reducer допускает только переходы из CONTRACTS.md. BookingService не знает о React или Redux. BookingResult.tsx отвечает только за представление. Цены не копируются в стейт и вычисляются из snapshot. Promise, Error, refs и сервис не помещаются в store/actions.

`BookingPage.tsx` собирает review, pending и result из переданных `App` данных и обработчиков. Он не создает форму, store или guard и не вызывает сервис. Корневой селектор находится в `app/src/app/store/selectors.ts`; внешние импорты booking идут через `app/src/pages/booking/index.ts`.

## Разрешенные файлы

 `app/src/app/App.tsx`, `app/src/pages/booking/model/bookingSlice.ts`, `app/src/pages/booking/model/bookingSlice.test.ts`, минимально `app/src/app/store/store.ts` / `hooks.ts`, `app/src/pages/booking/api/bookingService.ts`, `app/src/pages/booking/ui/BookingResult.tsx`, `app/src/pages/booking/ui/BookingReview.tsx`, минимально BookingSummary.tsx / `styles.css` для вывода состояний. Модель **не менять** без реального дефекта, документировать любое расширение ее API. Redux Toolkit обязателен. Не подключать backend, router, Zustand, React Query или RTK Query.

Также разрешены `app/src/pages/booking/ui/BookingPage.tsx`, `app/src/pages/booking/index.ts`, минимально `app/src/app/store/selectors.ts`, `app/src/app/store/bookingIntegration.test.tsx`. Проверки с Provider/store принадлежат `app`, reducer-тесты не импортируют приложение. SSR этих связей не заменяет DOM-проверки U03/U04/U10.

## Gate

- S02/S03: reducer проверен на submitting/success/soldOut/reject и запрещенные переходы; интеграционная проверка с Provider и отдельным store доказывает сохранение снимка и отсутствие дублей U04.

- U03: если текущие данные отличаются от review, отправка не производится.
- U04: двойное нажатие и Enter при подтверждении вызывают только **один** confirm в рамках попытки. Если невозможно надежно измерить без интеграционного теста, пометить проверку неполной для TASK 06.
- U05: pending заметен, действия заблокированы.
- U06: обычный URL дает success **после** кнопки confirm.
- U07: sold-out воспроизводится полным сценарием через URL-параметр.
- U08/U09: редактирование и повтор после отказа не теряют данных.
- U10: неожиданный reject отображается отдельно, pending всегда снимается.
- После изменения TS/TSX проходит `npm run build`; модельные тесты повторять только при изменении ее контракта. Для измененного потока нужен узкий integration/smoke confirm, иначе явно указать риск. Нельзя писать готово, если подтверждение не запускалось.

## Отчет

Приложить таблицу фактически пройденных U03-U10 и указать способ измерения количества вызовов. Уточнить, чем snapshot отличается от редактируемой формы и почему guard нужен помимо disabled.

**Прямой промпт Codex:** "Выполни `docs/tasks/04_BOOKING_FLOW.md`. Реализуй типизированный mock, атомарный confirm guard, сверку review и отправки, success/sold-out/reject. Не меняй визуальную концепцию и бизнес-правила."
