# UniRoute

AI-сервис для абитуриентов 9–11 классов: короткая анкета → диагностика профиля → подбор вузов → сравнение → персональный roadmap поступления.

**Стек:** Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · Framer Motion · lucide-react · Supabase (Postgres, Auth, RLS) · Vercel.

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
