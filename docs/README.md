# Документация SQOCH

Все инструкции и материалы проекта собраны в этой папке. Пути в тексте и командах считаются от корня SQOCH, если явно не указано иначе; Markdown-ссылки разрешаются относительно своего файла.

## Порядок чтения

1. [Рабочий процесс](WORKFLOW.md) — приоритет источников, границы изменений, проверки и передача результата.
2. [Спецификация](spec/SPEC.md), [требования](spec/REQUIREMENTS.md), [контракты](spec/CONTRACTS.md).
   Правила организации кода: [декомпозиция на основе FSD](spec/DECOMPOSITION.md).
3. [Карта разрешенных изменений](change_scope_map.md), текущая [задача](tasks/) и последний handoff в kaeru.
4. По предмету изменения: [приемка](spec/ACCEPTANCE.md), [проверки](testing.md), [архитектурные ограничения](architecture_contracts.md).
5. Для UI-этапов 02/05: [UX](spec/UX_BRIEF.md), [применение скилла](spec/SKILL_SETUP.md) и реально установленный SKILL.md.

## Задачи

| Задача | Результат |
|---|---|
| [00 — Bootstrap](tasks/00_BOOTSTRAP.md) | Запускаемый каркас React/TS/Vite |
| [01 — Domain](tasks/01_DOMAIN_MODEL.md) | Чистая модель и unit-проверки |
| [02 — Design](tasks/02_DESIGN_BLUEPRINT.md) | Дизайн-контракт с UI/UX Pro Max |
| [03 — Components](tasks/03_BUILD_COMPONENTS.md) | Редактирование и review |
| [04 — Booking](tasks/04_BOOKING_FLOW.md) | Подтверждение и результаты |
| [05 — Styling](tasks/05_STYLE_WITH_SKILL.md) | Адаптивность и доступность |
| [06 — Delivery](tasks/06_QA_DELIVERY.md) | Итоговая проверка и поставка |

## Дополнительные материалы

- [Стартовая команда](START_HERE.md) и [шаблон стартового промпта](templates/bootstrap_prompt.md).
- [Этапы и gates](implementation_stages.md).
- [Форма handoff](templates/HANDOFF.md) и [подробный шаблон](templates/review_handoff.md). Фактические результаты и решения сохраняются в kaeru; шаблоны не являются локальным журналом памяти.
- [Шаблон дополнительной задачи](templates/task_brief.md), [шаблон правил модуля](modules/TEMPLATE.md).
- [Первичные материалы](spec/sources/) — исходные PDF, план и аудит; оригиналы сохранены без изменений.
- [Прежний журнал](log/spec_decisions.md) — исторический материал, новые решения хранятся в kaeru.

Полные правила kaeru и резервного подключения находятся в корневом [AGENTS.md](../AGENTS.md).
