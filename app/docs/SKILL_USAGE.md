# UI/UX Pro Max: фактическое применение
- Прочитан C:/Users/kliod/.agents/skills/ui-ux-pro-max/SKILL.md; версия/commit установки не установлены.
- Использован существующий scripts/search.py в том же каталоге, без установки и сетевых запросов.
- В PowerShell установлен PYTHONIOENCODING=utf-8 для вывода; команды выполнены из корня SQOCH.
- python C:/Users/kliod/.agents/skills/ui-ux-pro-max/scripts/search.py "event ticket checkout minimal" --design-system -p "SQOCH Checkout" -f markdown
- Результат: Hero-Centric Design, Vibrant & Block-based, фиолетовый/оранжевый; компоновка не подходит форме.
- python C:/Users/kliod/.agents/skills/ui-ux-pro-max/scripts/search.py "checkout form minimal accessible" --design-system -p "SQOCH Checkout" -f markdown
- Уточнение: Minimalism & Swiss Style принят; Product Demo + Features снова не подходит checkout, проверенного подходящего layout в выдаче нет, сетка выбрана по UX_BRIEF.
- Светлый teal затемнен до #0F766E под белый текст; второй акцент и внешние Atkinson/Inter/Playfair отклонены.
- python C:/Users/kliod/.agents/skills/ui-ux-pro-max/scripts/search.py "error summary validation" --domain ux
- Получены Focusable Error Summary, Error Messages, Error Placement; приняты сводка после submit и связанные inline ошибки.
- python C:/Users/kliod/.agents/skills/ui-ux-pro-max/scripts/search.py "form state stable keys" --stack react
- Получены stable IDs, lazy initialization, local useState; принят field.id, рекомендация local useState для формы отклонена согласно контракту единого RHF.
- Из Quick Reference приняты видимый фокус, label, цели 44 px, базовый шрифт 16 px, отсутствие перекрытия фокуса.
- Решения проекта и сценарий 360 px описаны в UI_SYSTEM.md; browser preview не выполнен — подключенных браузеров нет.

## Задача 05 — применение к существующему интерфейсу

Источник тот же: C:/Users/kliod/.agents/skills/ui-ux-pro-max/SKILL.md, scripts/search.py; без установки пакетов и сетевого поиска. Запросы выполнены из корня SQOCH с PYTHONIOENCODING=utf-8:

- `python C:/Users/kliod/.agents/skills/ui-ux-pro-max/scripts/search.py "mobile form horizontal overflow" --domain ux -n 3`
- `python C:/Users/kliod/.agents/skills/ui-ux-pro-max/scripts/search.py "error summary validation" --domain ux -n 3`
- `python C:/Users/kliod/.agents/skills/ui-ux-pro-max/scripts/search.py "focus not obscured" --domain ux -n 3`

Приняты проверенные совпадения из ux-guidelines.csv: Long Token Wrapping (min-width: 0, overflow-wrap: anywhere), Error Placement (связанные inline ошибки), Focusable Error Summary (ссылки на ошибочные поля), Focus Not Obscured (обычный поток без перекрывающих панелей). Из Quick Reference применены единый акцент, текстовые признаки результата, контрастные токены, табличные цифры цен, 16 px в полях, высота контролов от 44 px.

Пример overflow-x-hidden отклонен: он скрывает переполнение вместо устранения причины. Table Handling не применяется — таблиц нет. Перенос фокуса на саму сводку ошибок отклонен в пользу первого ошибочного поля/группы по gate задач 03/05; App остается вне стилизации. Цветовая система и сетка сохранены из UI_SYSTEM.md, новый поиск визуального направления не требовался.

Браузерная проверка после реализации: встроенный Chromium, desktop 1280 px и viewport 360 px. Проверены четыре карточки, длинное имя без пробелов и email, отсутствие горизонтального переполнения, незавершенный итог, ссылки ошибок, ошибка сопровождения, сохранность данных и фокус при удалении/возврате. Tab/Enter проходят editing → review → pending → success/sold-out; видимая обводка 3 px, повторный отказ и возврат сохраняют данные. Через изолированный Provider/store и подставной сервис проверены техническая ошибка, фокус сообщения и успешный повтор; тестовая подстановка удалена перезагрузкой. Проверка 360 × 400 подтверждает доступность CTA при уменьшенной высоте и отсутствие fixed/sticky панелей; это не проверка настоящей экранной клавиатуры. Озвучивание скринридером отдельно не проверялось. Подробные результаты и актуальный статус проверок хранятся в kaeru.
