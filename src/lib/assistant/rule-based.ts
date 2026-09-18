import { BUDGETS, COUNTRY_NAME, FIELD_LABEL } from "@/lib/constants";
import { isRecommended, lowerFirst, matchUniversities, TIER_LABEL } from "@/lib/engine/match";
import type { MatchResult, ProfileDraft } from "@/lib/engine/types";
import { formatDate, formatDaysLeft, formatUsd } from "@/lib/format";
import type { AssistantStyle, ExamEntry } from "@/types/models";
import { examScoreError, formatScore } from "@/lib/exams";
import { compose, type Answer } from "./compose";
import type { AssistantContext } from "./context";
import { COUNTRY_ALIASES, mentionedUniversities } from "./mentions";

const UNIVERSITY_ALIASES: Record<string, RegExp> = {
  mit: /\bmit\b|массачусет/i,
  asu: /\basu\b|аризон/i,
  toronto: /торонто|toronto/i,
  ucl: /\bucl\b|университетский колледж лондон|university college london/i,
  manchester: /манчестер|manchester/i,
  tum: /\btum\b|мюнхен|munich/i,
  "tu-delft": /делфт|delft/i,
  polimi: /polimi|политехни|милан|politecnico/i,
  charles: /карлов|charles|прага|prague/i,
  kaist: /kaist|каист/i,
  nus: /\bnus\b|сингапур|singapore/i,
  melbourne: /мельбурн|melbourne/i,
  nazarbayev: /назарбаев|nazarbayev|\bnu\b|\bну\b/i,
  hku: /\bhku\b|гонконг|hong kong/i,
  koc: /ko[cç]\b|коч\b|koç/i,
};


const has = (text: string, re: RegExp) => re.test(text);

function recommendedSet(draft: ProfileDraft, ctx: AssistantContext) {
  return matchUniversities(draft, ctx.universities, ctx.scholarships).filter((m) => isRecommended(m, draft));
}

function diffRecommendations(before: MatchResult[], after: MatchResult[]) {
  const b = new Set(before.map((m) => m.university.slug));
  const a = new Set(after.map((m) => m.university.slug));
  return {
    added: after.filter((m) => !b.has(m.university.slug)),
    removed: before.filter((m) => !a.has(m.university.slug)),
  };
}

function describeDiff(before: MatchResult[], after: MatchResult[]): string[] {
  const { added, removed } = diffRecommendations(before, after);
  const points: string[] = [`Подходящих вузов: было ${before.length}, станет ${after.length}`];
  for (const m of added.slice(0, 4)) points.push(`+ **${m.university.name}** — ${TIER_LABEL[m.tier].toLowerCase()}, шанс ≈${m.chance}%, ≈${formatUsd(m.costs.net)}/год`);
  for (const m of removed.slice(0, 3)) points.push(`− ${m.university.name} уйдёт из подборки`);
  if (!added.length && !removed.length) points.push("Список вузов не изменится, но шансы и стоимость пересчитаются");
  return points;
}

// ------------------------------------------------------------------ intents

function whatIfBudget(text: string, ctx: AssistantContext): Answer | null {
  const m = text.match(/(\d{1,3}(?:[\s.,]?\d{3})*|\d+)\s*(k|к|тыс|000|\$)?/i);
  if (!m || !has(text, /бюджет|\$|долл|тыс|\d+\s?[kк]\b/i)) return null;
  let amount = Number(m[1].replace(/[\s.,]/g, ""));
  if (/k|к|тыс/i.test(m[2] ?? "") || amount < 200) amount *= 1000;
  const budget = BUDGETS.find((b) => b.value >= amount)?.value ?? 100000;
  const draft = { ...ctx.draft, budget_usd_per_year: budget };
  const after = recommendedSet(draft, ctx);
  return {
    headline: `Если бюджет будет ${formatUsd(amount)} в год (обучение + жизнь):`,
    points: describeDiff(ctx.recommended, after),
    steps: ["Обнови бюджет в анкете — рекомендации и маршрут пересчитаются автоматически", "Добавь новые варианты в сравнение, чтобы увидеть их рядом"],
    links: [["Изменить бюджет в анкете", "/profile"]],
  };
}

function whatIfCountry(text: string, ctx: AssistantContext): Answer | null {
  if (!has(text, /хочу|добав|а если|рассмотр|поменя|учиться в|поехать|переехать|что насч[её]т/i)) return null;
  const codes = COUNTRY_ALIASES.filter(([, re]) => re.test(text)).map(([code]) => code);
  if (!codes.length) return null;
  const target = ctx.draft.target_countries.length ? [...new Set([...ctx.draft.target_countries, ...codes])] : codes;
  const draft = { ...ctx.draft, target_countries: target };
  const after = recommendedSet(draft, ctx);
  const inCountry = matchUniversities(draft, ctx.universities, ctx.scholarships).filter((m) => codes.includes(m.university.country_code));
  return {
    headline: `Посчитал, что изменится, если рассматривать: ${codes.map((c) => COUNTRY_NAME[c]).join(", ")}.`,
    points: [
      ...describeDiff(ctx.recommended, after),
      ...inCountry
        .filter((m) => !isRecommended(m, draft))
        .slice(0, 2)
        .map((m) => `${m.university.name} пока не проходит: ${m.blockers[0] ?? m.concerns[0]?.text ?? "низкое совпадение"}`),
    ],
    steps: ["Добавь страну в анкете (шаг «Страны»)", "Проверь, нужен ли подготовительный год и язык обучения"],
    links: [["Изменить страны", "/profile"]],
  };
}

function whatIfExam(text: string, ctx: AssistantContext): Answer | null {
  const m = text.match(/(ielts|айелтс|toefl|тоефл|sat|сат)\D{0,12}(\d{1,4}(?:[.,]\d)?)/i);
  if (!m) return null;
  const type: ExamEntry["type"] = /ielts|айелтс/i.test(m[1]) ? "IELTS" : /toefl|тоефл/i.test(m[1]) ? "TOEFL" : "SAT";
  const score = Number(m[2].replace(",", "."));
  const invalid = examScoreError(type, score);
  if (invalid) {
    return {
      final: true,
      headline: `Такого результата ${type} не бывает.`,
      points: [invalid],
      steps: [`Спроси ещё раз с реальным баллом, например: «а если ${type} ${formatScore(type, type === "SAT" ? 1400 : type === "IELTS" ? 7 : 100)}?»`],
    };
  }
  const draft: ProfileDraft = { ...ctx.draft, exams: [...ctx.draft.exams.filter((e) => e.type !== type), { type, score, status: "taken" }] };
  const afterAll = matchUniversities(draft, ctx.universities, ctx.scholarships);
  const after = afterAll.filter((x) => isRecommended(x, draft));
  const changes = ctx.recommended
    .slice(0, 4)
    .map((b) => {
      const a = afterAll.find((x) => x.university.id === b.university.id)!;
      return a.chance !== b.chance ? `${b.university.name}: шанс ${b.chance}% → **${a.chance}%**` : null;
    })
    .filter(Boolean) as string[];
  return {
    headline: `С ${type} ${score}:`,
    points: [...changes, ...describeDiff(ctx.recommended, after)],
    steps: [`Когда сдашь ${type} — отметь результат в анкете, план перестроится`, `Запиши экзамен минимум за 6 недель до первого дедлайна`],
    links: [["Обновить экзамены в анкете", "/profile"]],
  };
}

function findUniversity(text: string, ctx: AssistantContext) {
  const slug = Object.entries(UNIVERSITY_ALIASES).find(([, re]) => re.test(text))?.[0];
  return (slug ? ctx.matches.find((m) => m.university.slug === slug) : undefined) ?? mentionedUniversities(text, ctx.matches, 1)[0];
}

function chances(text: string, ctx: AssistantContext): Answer | null {
  const named = findUniversity(text, ctx);
  const asksChance = has(text, /шанс|поступлю|пройду|реально ли|вероятн|возьмут|примут/i);
  if (!named && !asksChance) return null;
  const list = named ? [named] : ctx.recommended.slice(0, 3);
  if (!list.length) return { headline: "Пока нет вузов в подборке — сначала заполни анкету.", links: [["Открыть анкету", "/profile"]] };

  if (named && !asksChance) {
    const u = named.university;
    return {
      headline: `${u.name} (${u.city}, ${u.country}): совпадение ${named.score}%, шанс ≈${named.chance}% — «${TIER_LABEL[named.tier]}».`,
      points: [
        ...named.reasons.slice(0, 3).map((r) => `✓ ${r.text}`),
        ...named.concerns.filter((c) => (c.weight ?? 0) > 0).slice(0, 2).map((c) => `⚠ ${c.text}`),
        `Стоимость для семьи ≈${formatUsd(named.costs.net)}/год${named.nextDeadline ? `, ближайший дедлайн — ${formatDate(named.nextDeadline.date)}` : ""}`,
      ],
      steps: named.eligible ? ["Добавь вуз в сравнение", "Проверь требования на официальном сайте"] : [`Сейчас мешает: ${named.blockers.join(", ")}`],
      links: [["Карточка вуза", `/recommendations#u-${u.slug}`]],
    };
  }

  const points: string[] = [];
  const steps = new Set<string>();
  for (const m of list) {
    const minus = m.chanceFactors.filter((f) => f.impact < 0).sort((a, b) => a.impact - b.impact);
    const plus = m.chanceFactors.filter((f) => f.impact > 0).sort((a, b) => b.impact - a.impact);
    points.push(
      [
        `**${m.university.name}** — ≈${m.chance}% (${TIER_LABEL[m.tier].toLowerCase()}).`,
        plus[0] && `Помогает: ${lowerFirst(plus[0].text)}.`,
        minus[0] && `Мешает: ${lowerFirst(minus[0].text)}.`,
      ]
        .filter(Boolean)
        .join(" "),
    );
    for (const f of minus.slice(0, 2)) {
      if (f.label === "Английский") steps.add(`Подтянуть английский до IELTS ${m.university.min_ielts?.toFixed(1)}+`);
      if (f.label === "SAT") steps.add(`Сдать SAT${m.university.sat_recommended ? ` на ${m.university.sat_recommended}+` : ""}`);
      if (f.label === "Оценки") steps.add("Поднять оценки в текущем полугодии — последние классы важнее всего");
      if (f.label === "Активности") steps.add("Добавить олимпиаду или проект по профилю");
    }
  }
  return {
    headline: named ? `Разберём шанс в ${named.university.name}.` : "Вот как я оцениваю шансы в вузах из твоей подборки:",
    points,
    steps: [...steps].slice(0, 4),
    details: "Это оценка по открытой статистике (доля поступивших, требования) и твоему профилю — не гарантия.",
    links: [["Подробнее в рекомендациях", "/recommendations"]],
  };
}

const CLICHES = ["с детства", "с ранних лет", "всю жизнь", "всегда мечтал", "всегда мечтала", "целеустремл", "ответственный", "since i was a child", "passionate", "always dreamed", "hard-working"];

function essayReview(text: string, ctx: AssistantContext): Answer | null {
  if (text.length < 400 || text.split(/[.!?]/).length < 5) return null;
  const words = text.trim().split(/\s+/).length;
  const paragraphs = text.split(/\n\s*\n|\n/).filter((p) => p.trim().length > 40).length;
  const cyrillic = (text.match(/[а-яё]/gi)?.length ?? 0) / text.length > 0.3;
  const cliches = CLICHES.filter((c) => text.toLowerCase().includes(c));
  const hasNumbers = /\d/.test(text);
  const mentionsUniversity = ctx.universities.some((u) => text.toLowerCase().includes(u.name.toLowerCase().split(" ").slice(-1)[0])) || /университет|university/i.test(text);
  const mentionsGoal = /хочу стать|в будущем|моя цель|планирую|my goal|i want to|in the future/i.test(text);
  const firstSentence = text.split(/[.!?]/)[0].trim().split(/\s+/).length;

  const points = [
    `Объём: ${words} слов, ${paragraphs} абзац(ев). ${words < 350 ? "Коротковато — обычно ждут 500–650 слов." : words > 700 ? "Длинновато — многие вузы ограничивают 650 словами." : "Хороший объём."}`,
  ];
  const steps: string[] = [];
  if (cyrillic) steps.push("Большинство вузов из подборки принимают эссе на английском — переведи текст, сохранив свой голос");
  if (cliches.length) steps.push(`Убери клише: «${cliches.slice(0, 3).join("», «")}» — замени конкретным случаем из жизни`);
  if (!hasNumbers) steps.push("Добавь конкретику: цифры, названия проектов, результаты олимпиад");
  if (firstSentence > 25) steps.push("Первое предложение длинное — начни с короткой сцены или вопроса, чтобы зацепить читателя");
  if (!mentionsUniversity) steps.push("Добавь абзац «почему именно этот вуз и программа» — с названием курса или лаборатории");
  if (!mentionsGoal) steps.push(`Закончи целью${ctx.draft.goal ? `: например, «${ctx.draft.goal}»` : " — кем хочешь стать и как программа в этом поможет"}`);
  if (paragraphs < 3) steps.push("Разбей текст на 4–5 абзацев: история → интерес → опыт → почему вуз → цель");
  if (!steps.length) points.push("Структура и конкретика на хорошем уровне — осталось вычитать грамматику и попросить учителя прочитать.");

  return { headline: "Посмотрел твоё эссе.", points, steps, links: [["Шаги по эссе в маршруте", "/roadmap"]] };
}

function essayHelp(text: string, ctx: AssistantContext): Answer | null {
  if (!has(text, /эссе|мотивацион|essay|personal statement|сочинени|письмо/i)) return null;
  const field = ctx.draft.interests.map((i) => lowerFirst(FIELD_LABEL[i] ?? i)).join(", ") || "выбранное направление";
  const uni = ctx.recommended[0]?.university.name ?? "вуз мечты";
  const activity = ctx.draft.activities[0]?.title;
  return {
    headline: "Вот структура мотивационного эссе, которая работает для большинства вузов:",
    details: [
      `**1. Крючок (2–3 предложения).** Конкретный момент, когда тебя «зацепило» ${field}. Не «с детства мечтал», а сцена: где ты был(а), что произошло.`,
      `**2. Как рос интерес.** Что ты делал(а) дальше${activity ? ` — например, «${activity}»` : ""}: проекты, олимпиады, книги, курсы. С цифрами и результатами.`,
      "**3. Чему научился(ась).** Трудность → как справился(ась) → что понял(а) о себе.",
      `**4. Почему ${uni}.** Конкретная программа, курс, лаборатория или преподаватель — 2–3 предложения, разные для каждого вуза.`,
      `**5. Цель.** ${ctx.draft.goal ? `«${ctx.draft.goal}»` : "Кем хочешь стать"} и как программа поможет туда прийти.`,
    ].join("\n"),
    steps: ["Напиши черновик за один вечер, не редактируя", "Вставь текст сюда — я разберу его по пунктам", "Попроси учителя английского вычитать финальную версию"],
    links: [["Шаги по эссе в маршруте", "/roadmap"]],
  };
}

function activities(text: string, ctx: AssistantContext): Answer | null {
  if (!has(text, /активност|олимпиад|волонт|проект|внеучеб|портфолио|экстракур|кружк|хакатон/i)) return null;
  const field = ctx.draft.interests[0];
  const ideas: Record<string, string[]> = {
    cs: ["Олимпиада по информатике (региональный этап → республика)", "Проект на GitHub: бот, сайт или анализ открытых данных", "Хакатон или летняя IT-школа"],
    engineering: ["Робототехника (FIRST, WRO)", "Инженерный проект с чертежами и фото", "Хакатон или технический кружок"],
    math: ["Олимпиада по математике", "Онлайн-курсы (Stepik, Coursera) с сертификатом", "Кружок или мини-исследование по статистике"],
    medicine: ["Волонтёрство в больнице или фонде", "Олимпиада по биологии или химии", "Научный проект с учителем биологии"],
    business: ["Мини-бизнес или школьная ярмарка", "Кейс-чемпионат", "Финансовая грамотность: курс + проект"],
    economics: ["Олимпиада по экономике", "Аналитическая статья или блог", "Model UN или дебаты"],
  };
  const list = (field && ideas[field]) || ["Олимпиада по профильному предмету", "Волонтёрство с регулярным графиком", "Собственный проект, который можно показать"];
  return {
    headline: `С активностями сейчас ${ctx.draft.activities.length ? `так: ${ctx.draft.activities.map((a) => a.title.toLowerCase()).join(", ")}` : "пусто — это легко исправить"}.`,
    points: ["Приёмным комиссиям важнее глубина, чем количество: 1–2 сильных направления лучше пяти кружков."],
    steps: list,
    links: [["Отметить активности в анкете", "/profile"]],
  };
}

function scholarships(text: string, ctx: AssistantContext): Answer | null {
  if (!has(text, /стипенди|грант|бесплатн|дешевле|финанс|скидк|оплат/i)) return null;
  const eligible = ctx.scholarshipMatches.filter((s) => s.status === "eligible").slice(0, 4);
  const almost = ctx.scholarshipMatches.filter((s) => s.status === "almost").slice(0, 2);
  return {
    headline: `Подходят уже сейчас: ${ctx.scholarshipMatches.filter((s) => s.status === "eligible").length}, почти подходят: ${ctx.scholarshipMatches.filter((s) => s.status === "almost").length}.`,
    points: [
      ...eligible.map((s) => `**${s.scholarship.name}** — ${s.scholarship.amount_note}${s.deadline ? `, до ${formatDate(s.deadline.date)}` : ""}`),
      ...almost.map((s) => `${s.scholarship.name} — не хватает: ${s.gaps[0]}`),
    ],
    steps: ["Начни с грантов для вузов из своей подборки — там конкуренция ниже", "Подготовь документы о доходах семьи заранее — они нужны для need-based помощи"],
    links: [["Все стипендии", "/scholarships"]],
  };
}

const STEP_TIPS: Record<string, string[]> = {
  exam: ["Пройди пробный тест, чтобы понять текущий уровень", "Выдели 45 минут в день: чередуй Reading/Listening и Writing/Speaking", "Запишись на экзамен сразу — дата дисциплинирует"],
  document: ["Составь список документов и у кого их взять", "Попроси нужные бумаги заранее: школе и учителям нужно время", "Сохрани сканы в одну папку в облаке"],
  application: ["Создай аккаунт на портале вуза", "Проверь список документов и требований на официальном сайте", "Подай заявку за 3–5 дней до дедлайна, а не в последний день"],
  scholarship: ["Проверь условия и список документов на официальной странице", "Адаптируй мотивационное письмо под цели стипендии", "Отметь дедлайн в календаре с напоминанием за неделю"],
  academic: ["Выпиши предметы, где оценка ниже желаемой", "Договорись с учителем о пересдаче или доп. задании", "Занимайся по 30 минут в день, а не перед контрольной"],
  activity: ["Выбери одно направление, связанное с будущей специальностью", "Поставь цель на 2–3 месяца с понятным результатом", "Фиксируй результаты: фото, сертификаты, ссылки"],
  deadline: ["Сравни офферы по стоимости, стипендии и шансу трудоустройства", "Уточни сроки подтверждения места", "Спроси меня, если сложно выбрать"],
};

function stepHelp(text: string, ctx: AssistantContext): Answer | null {
  const quoted = text.match(/[«"](.+?)[»"]/)?.[1];
  const step = quoted ? ctx.steps.find((s) => s.title === quoted) : undefined;
  if (step) {
    return {
      headline: `Шаг «${step.title}»${step.due_date ? ` — до ${formatDate(step.due_date)} (${formatDaysLeft(step.due_date)})` : ""}.`,
      points: step.description ? [step.description] : undefined,
      steps: STEP_TIPS[step.category] ?? STEP_TIPS.document,
      links: [["Открыть маршрут", "/roadmap"]],
    };
  }
  if (!has(text, /что делать|с чего начать|план|следующ|на этой неделе|сегодня|дедлайн|срок|успеть/i)) return null;
  const open = ctx.steps.filter((s) => s.status === "todo" || s.status === "in_progress");
  if (!open.length) return { headline: "Маршрут ещё не построен — открой страницу маршрута, и я предложу шаги.", links: [["Построить маршрут", "/roadmap"]] };
  const soon = open.slice(0, 4);
  return {
    headline: `Ближайшее важное — «${soon[0].title}»${soon[0].due_date ? ` (${formatDaysLeft(soon[0].due_date)})` : ""}.`,
    points: soon.slice(1).map((s) => `${s.title}${s.due_date ? ` — ${formatDate(s.due_date)}` : ""}`),
    steps: STEP_TIPS[soon[0].category] ?? [],
    links: [["Весь маршрут", "/roadmap"], ["Календарь дедлайнов", "/roadmap?view=calendar"]],
  };
}

function routeChange(text: string): Answer | null {
  if (!has(text, /поменя|измени|другой вуз|не подходит|не нравится|передума|скорректир/i)) return null;
  return {
    headline: "Маршрут легко перестроить — он пересчитывается от твоих ответов.",
    steps: [
      "Поменяй ответы в анкете (страны, бюджет, экзамены, ограничения) — рекомендации изменятся сразу",
      "Добавь в сравнение вузы, которые тебе действительно интересны — план строится для них",
      "Выполненные шаги сохранятся, а неактуальные уйдут из плана",
    ],
    points: ["Можешь спросить меня «а если бюджет $30k?» или «хочу в Германию» — сначала посчитаю, что изменится."],
    links: [["Анкета", "/profile"], ["Сравнение", "/compare"]],
  };
}

function greeting(text: string, ctx: AssistantContext): Answer | null {
  if (!has(text, /^(привет|здравств|хай|hello|hi)\b|что ты умеешь|чем поможешь|помощь|help/i)) return null;
  return {
    headline: `${ctx.name ? `Привет, ${ctx.name}!` : "Привет!"} Я знаю твою анкету, подборку вузов и маршрут.`,
    points: [
      "Посчитаю, что изменится: «а если бюджет $30k?», «хочу в Германию», «если сдам IELTS 7»",
      "Объясню шансы: «какие шансы в KAIST?»",
      "Помогу с эссе — или вставь текст, и я его разберу",
      "Подскажу активности, стипендии и что делать на этой неделе",
    ],
  };
}

function fallback(ctx: AssistantContext): Answer {
  const top = ctx.recommended[0];
  const next = ctx.steps.find((s) => s.status === "todo" || s.status === "in_progress");
  return {
    headline: "Не уверен, что правильно понял вопрос. Вот что важно прямо сейчас:",
    points: [
      top ? `Лучшее совпадение — ${top.university.name} (шанс ≈${top.chance}%)` : "Подборка появится после анкеты",
      next ? `Следующий шаг — «${next.title}»` : "Маршрут ещё не построен",
    ],
    steps: ["Спроси про шансы, эссе, активности или стипендии", "Или сценарий: «а если бюджет $30k?»"],
  };
}

/**
 * The app's own calculation for a question (what-if scenarios, chances, deadlines…),
 * or null when no rule recognises it. The LLM receives this as ground truth.
 */
export function ruleBasedAnswer(message: string, ctx: AssistantContext): Answer | null {
  const text = message.trim();
  if (!ctx.profileComplete) return null;
  const handlers = [essayReview, stepHelp, whatIfExam, whatIfBudget, whatIfCountry, essayHelp, scholarships, activities, chances, (t: string) => routeChange(t), greeting];
  for (const handler of handlers) {
    const answer = handler(text, ctx);
    if (answer) return answer;
  }
  return null;
}

/** Offline reply used when no language model is reachable. */
export function ruleBasedReply(message: string, style: AssistantStyle, ctx: AssistantContext): string {
  if (!ctx.profileComplete) {
    return compose(style, {
      headline: "Сначала заполни анкету — без неё я не знаю твой профиль.",
      points: ["Это займёт около 5 минут: класс, интересы, оценки, экзамены, страны и бюджет."],
      links: [["Заполнить анкету", "/profile"]],
    });
  }
  return compose(style, ruleBasedAnswer(message, ctx) ?? fallback(ctx));
}
