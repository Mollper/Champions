# UniRoute

AI-сервис для абитуриентов 9–11 классов: короткая анкета → диагностика профиля → подбор вузов → сравнение → персональный roadmap поступления.

**Стек:** Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · Framer Motion · lucide-react · Supabase (Postgres, Auth, RLS) · Vercel.

## Что внутри

| Путь | Что делает |
| --- | --- |
| `/` | Анимированный лендинг (Framer Motion), реальные вузы из БД |
| `/login` | Вход и регистрация (Supabase Auth, email + пароль) |
| `/profile` | Анкета из 7 шагов с живым подбором, прогресс сохраняется на каждом шаге |
| `/overview` | Диагностика: цель, готовность, сильные стороны и ограничения |
| `/recommendations` | Вузы с фото, шансом, объяснением «почему подходит», стоимостью с учётом стипендий |
| `/compare` | Сравнение 2–4 вузов по приоритетам пользователя |
| `/roadmap` | План по месяцам + календарь дедлайнов, отметка прогресса |
| `/dashboard` | Главная: один выделенный «следующий шаг» |
| `/scholarships` | Подбор стипендий с проверкой условий |
| `/api/assistant` | AI-помощник (стрим ответа, история, 4 стиля общения) |
| `/api/recommendations` | Подбор в JSON |

**Движок** (`src/lib/engine`) — чистые функции: нормализация GPA и экзаменов, совпадение, шанс поступления с объяснением факторов, диагностика, генерация маршрута. Любое изменение анкеты повышает `profiles.version` (триггер учитывает только значимые поля) — рекомендации пересчитываются, маршрут перестраивается, выполненные шаги сохраняются.

**AI-помощник** сейчас работает на rule-based провайдере (`src/lib/assistant/rule-based.ts`), который знает профиль, подборку, маршрут и стипендии и умеет считать сценарии «что если». Контракт API-роута не зависит от провайдера — LLM подключается заменой функции `ruleBasedReply`.

## Запуск

```bash
npm install
cp .env.example .env.local   # вписать URL и publishable key проекта Supabase
npm run dev
```

## База данных

Миграции лежат в `supabase/migrations/`:

| Файл | Что делает |
| --- | --- |
| `…_init_schema.sql` | Таблицы `users`, `profiles`, `universities`, `scholarships`, `roadmaps`, `roadmap_steps`, `shortlist`, `chat_messages`; триггеры; явные GRANT; RLS-политики |
| `…_seed_universities.sql` | 15 реальных вузов (фото из Wikimedia Commons, ссылки на официальные сайты) и 16 реальных стипендий |
| `…_index_roadmap_steps_owner_fk.sql` | Покрывающий индекс для составного FK (по рекомендации `supabase db advisors`) |

Проект Supabase: **UFOCUSE** (`tdntqwsfqpjkxzkhpqqh`, регион ap-northeast-2). Новая миграция:

```bash
npx supabase migration new <name>
npx supabase db push --linked
npx supabase db advisors --linked
npx supabase gen types typescript --linked --schema public > src/types/database.ts
```

`src/types/database.ts` генерируется автоматически; строгие доменные типы (union-ы из CHECK-ограничений, форма jsonb) — в `src/types/models.ts`.

### Модель доступа

- `universities`, `scholarships` — справочники, чтение для всех (`anon`, `authenticated`), запись только `service_role`.
- Всё остальное — только владелец строки (`auth.uid() = user_id`). `users.email` менять нельзя (гранты по колонкам).
- `roadmap_steps` ссылается на `roadmaps (id, user_id)` составным FK — шаг нельзя привязать к чужому плану.
- `profiles.version` растёт при каждом изменении анкеты — по нему рекомендации и roadmap понимают, что устарели. Прогресс шагов сохраняется при перегенерации благодаря стабильному `step_key`.

### Демо-данные

Вузы, стипендии, ссылки и фотографии реальные, но цифры (стоимость, проходные баллы, доля поступивших, дедлайны) — **ориентировочные** на цикл 2026/27. У каждой записи есть `is_demo = true` и `data_source`; в интерфейсе они помечаются как «демонстрационные данные».
