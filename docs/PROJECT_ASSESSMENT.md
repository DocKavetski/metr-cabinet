# Оценка проекта МЕТР кабинет

Дата: 2026-08-06

## Краткий вердикт

Небольшое клиническое веб‑приложение (React 19 + Vite, ~6.5k LOC в `psycho-app/src` + scripts): каталог из **49** шкал, ввод ответов, расчёт, печать бланков, два специалиста, GitHub Pages + portable single‑file HTML. Архитектура понятная для размера продукта; основные риски — концентрация логики/CSS, деплой без сборки в CI и мёртвый код.

## Архитектура

| Слой | Где | Роль |
|------|-----|------|
| UI | `App.tsx`, `components/*` | Каталог, ввод, сводка, облачка (только Бубнова) |
| Состояние | `hooks/usePersistedState`, `lib/storage` | localStorage: ответы, избранное, тема, специалист |
| Данные | `data/*.ts` | Шкалы, свободные бланки, специалисты, батареи |
| Расчёт | `lib/scoring.ts` + `score` в данных | Строка цифр → текст результата |
| Печать | `lib/blank.ts`, `officialBlank.ts`, `@media print` | HTML в `#print-root` → `window.print()` |
| QA | `scripts/qa-all.ts` | Реестр, бланки, золотые кейсы расчёта |
| Доставка | `docs/` + `Расчет тестов/` | Закоммиченный single‑file билд; Pages из `docs/` |

## Сильные стороны

- Доменный QA‑скрипт с проверкой бланков и золотыми кейсами
- Чёткое разделение «свободный оригинал» vs коммерческие шкалы (`ORIGINAL_BLANKS_RESEARCH.md`)
- Portable single‑file под `file://` / флешку для кабинета
- Простое persistence без лишнего state‑framework

## Узкие места

1. **`App.css` (~1800 строк)** — тема, сайдбар, сцена, облачка, breakpoints, вся печать
2. **`blank.ts` (~400)** — вёрстка + пакетная печать + duplex‑эвристики
3. **`App.tsx` (~370)** — оркестрация расчёта, pack mode, toast, режимы ввода
4. **Дубли** — `yesNo` / частоты PHQ в нескольких data‑файлах; формулировка остроты ASQ в UI и бланках расходилась
5. **Мёртвое** — `DigitMapHint`, неиспользуемые SVG/PNG, батареи не в UI (только QA)
6. **Деплой** — workflow заливает `docs/` как есть, без `npm run build` / `qa` на PR

## Приоритеты рефакторинга

### Сделано в этом проходе

- Удалён мёртвый DigitMapHint и CSS
- Общие опции `yesNo` / константа остроты ASQ; `tsx`; CI
- Убраны неиспользуемые ассеты Vite и модуль батарей (`batteries.ts`)
- `App.css` → `styles/{theme,sidebar,stage,support,print,responsive}.css`
- Из `App.tsx` вынесены `TestPanel` и `StageToolbar`
- `blank.ts` → `blankHtml.ts` + `blankPack.ts`
- Специальные scorers (SCL/ASQ/FSFI/AQ) через `TestConfig.score` (`lib/scorers.ts`)

### Дальше (по желанию)

| Шаг | Ценность | Риск |
|-----|----------|------|
| Сборка Pages в CI из `npm run build` | Целостность деплоя | Средний (процесс) |
| Self‑host шрифтов | Offline / `file://` | Средний |
| Больше золотых кейсов QA (HADS, PSQI, CTQ…) | Надёжность расчёта | Низкий |

## Метрики (ориентир)

- Шкал: 49  
- Свободных официальных бланков: 10  
- Крупные модули: `styles/print.css`, `blankHtml.ts`, `qa-all.ts`, `personality.ts`
