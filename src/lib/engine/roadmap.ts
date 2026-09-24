import { FIELD_LABEL } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { RoadmapStepCategory } from "@/types/models";
import { lowerFirst } from "./match";
import { activityStrength, defaultStartYear, englishLevel, examScore, gpaTo4, toIso } from "./normalize";
import type { ScholarshipMatch } from "./scholarships";
import type { MatchResult, ProfileDraft } from "./types";

export type PlannedStep = {
  step_key: string;
  category: RoadmapStepCategory;
  title: string;
  description: string;
  due_date: string | null;
  priority: 1 | 2 | 3;
  university_id: number | null;
};

const DAY = 86_400_000;
const addDays = (iso: string, days: number) => toIso(new Date(new Date(`${iso}T00:00:00`).getTime() + days * DAY));

const ACTIVITY_IDEAS: Record<string, { title: string; text: string }> = {
  cs: { title: "Сделать IT-проект и выложить на GitHub", text: "Бот, сайт или анализ данных — то, что можно показать в заявке и обсудить в эссе." },
  engineering: { title: "Собрать инженерный проект", text: "Робот, 3D-модель или участие в хакатоне — с фото и описанием для портфолио." },
  math: { title: "Решать олимпиадную математику", text: "Регулярные задачи и участие в олимпиадах — сильный сигнал для технических вузов." },
  science: { title: "Провести мини-исследование", text: "Школьный научный проект или конференция — пригодится в эссе и рекомендациях." },
  medicine: { title: "Волонтёрство в медицине или биологии", text: "Помощь в клинике, лаборатории или фонде показывает осознанный выбор профессии." },
  business: { title: "Запустить мини-бизнес или кейс-чемпионат", text: "Свой проект, ярмарка или бизнес-кейс — отличная история для заявки." },
  economics: { title: "Участвовать в олимпиаде по экономике", text: "Или написать аналитическую статью — это усиливает профиль для экономических программ." },
  law: { title: "Дебаты или Model UN", text: "Публичные выступления и аргументация ценятся на юридических программах." },
  social: { title: "Социальный проект или исследование", text: "Опрос, волонтёрство или проект в школе — покажет интерес к людям и обществу." },
  humanities: { title: "Публикации или литературный конкурс", text: "Статьи, эссе, участие в конкурсах — портфолио для гуманитарных программ." },
  design: { title: "Собрать дизайн-портфолио", text: "10–15 лучших работ: многие программы по дизайну просят портфолио при подаче." },
  architecture: { title: "Собрать портфолио по архитектуре", text: "Скетчи, макеты, 3D-модели — обязательная часть заявки на архитектуру." },
  arts: { title: "Портфолио творческих работ", text: "Лучшие работы с описанием идеи — для творческих программ это главный критерий." },
  media: { title: "Вести медиа-проект", text: "Блог, подкаст или школьная газета — покажет практический опыт." },
};

export function planRoadmap(
  p: ProfileDraft,
  targets: MatchResult[],
  scholarships: ScholarshipMatch[],
  today = new Date(),
): PlannedStep[] {
  const steps: PlannedStep[] = [];
  const todayIso = toIso(today);
  const startYear = p.start_year ?? defaultStartYear(today);
  const add = (s: Omit<PlannedStep, "university_id"> & { university_id?: number | null }) => steps.push({ university_id: null, ...s });

  const deadlines = targets
    .map((t) => t.nextDeadline?.date)
    .filter((d): d is string => Boolean(d))
    .sort();
  // earliest application deadline drives preparation dates
  const earliest = deadlines[0] ?? `${startYear}-01-15`;
  const before = (days: number) => addDays(earliest, -days);

  const gpa4 = gpaTo4(p.gpa, p.gpa_scale);
  const english = englishLevel(p);
  const needIelts = Math.max(0, ...targets.map((t) => t.university.min_ielts ?? 0));
  const needGpa = Math.max(0, ...targets.map((t) => t.university.avg_gpa_4 ?? t.university.min_gpa_4 ?? 0));
  const names = targets.map((t) => t.university.name);
  const namesText = names.length ? names.join(", ") : "выбранных вузов";

  // ---------------------------------------------------------------- academic
  const semesterEnd = today.getMonth() >= 7 ? `${today.getFullYear()}-12-25` : `${today.getFullYear()}-05-31`;
  add({
    step_key: "academic-grades",
    category: "academic",
    title: gpa4 != null && needGpa > 0 && gpa4 < needGpa ? `Поднять средний балл до ≈${needGpa.toFixed(1)} из 4` : "Удержать высокий средний балл в этом полугодии",
    description: `Вузы смотрят на оценки последних классов. Для ${namesText} ориентир — не ниже ${needGpa ? needGpa.toFixed(1) : "3.5"} по шкале 4.0.`,
    due_date: semesterEnd,
    priority: gpa4 != null && gpa4 < needGpa - 0.2 ? 1 : 2,
  });
  add({
    step_key: "doc-transcript",
    category: "document",
    title: "Получить транскрипт оценок за последние 3 года",
    description: "Выписка оценок с печатью школы — нужна почти для всех заявок. Попроси в учебной части заранее.",
    due_date: before(60),
    priority: 2,
  });

  // ---------------------------------------------------------------- english
  if (needIelts > 0 && (english.source !== "exam" || (english.ielts ?? 0) < needIelts)) {
    const retake = english.source === "exam";
    add({
      step_key: "exam-english-prep",
      category: "exam",
      title: retake ? `Подготовиться к пересдаче IELTS на ${needIelts.toFixed(1)}+` : `Начать подготовку к IELTS на ${needIelts.toFixed(1)}+`,
      description: `Сейчас: ${english.label}. Нужно ${needIelts.toFixed(1)} для ${namesText}. План: пробный тест → 6–8 недель с упором на Writing и Speaking.`,
      due_date: before(110),
      priority: 1,
    });
    add({
      step_key: "exam-english-book",
      category: "exam",
      title: "Записаться на IELTS",
      description: "Места в тестовых центрах заканчиваются за 1–2 месяца. Выбирай дату минимум за 6 недель до первого дедлайна.",
      due_date: before(90),
      priority: 1,
    });
    add({
      step_key: "exam-english-take",
      category: "exam",
      title: `Сдать IELTS на ${needIelts.toFixed(1)}+`,
      description: "Результаты приходят через 3–13 дней. Если не хватит балла — останется время на пересдачу.",
      due_date: before(45),
      priority: 1,
    });
  }

  // ---------------------------------------------------------------- SAT & entrance exams
  const sat = examScore(p, "SAT");
  const satTargets = targets.filter((t) => t.university.sat_required || (t.university.sat_recommended && !t.university.requires_foundation));
  const needSat = Math.max(0, ...satTargets.map((t) => t.university.sat_recommended ?? 0));
  if (satTargets.some((t) => t.university.sat_required) && (sat.taken == null || sat.taken < needSat)) {
    add({
      step_key: "exam-sat-book",
      category: "exam",
      title: "Зарегистрироваться на SAT",
      description: `SAT нужен для: ${satTargets.filter((t) => t.university.sat_required).map((t) => t.university.name).join(", ")}. Регистрация на сайте College Board.`,
      due_date: before(100),
      priority: 1,
    });
    add({
      step_key: "exam-sat-take",
      category: "exam",
      title: `Сдать SAT${needSat ? ` на ${needSat}+` : ""}`,
      description: "Сосредоточься на математике — это самый быстрый способ поднять общий балл.",
      due_date: before(40),
      priority: 1,
    });
  }
  for (const t of targets) {
    const u = t.university;
    for (const exam of u.entrance_exams.filter((e) => /NUET|TOL|вступительн/i.test(e))) {
      add({
        step_key: `exam-entrance-${u.slug}`,
        category: "exam",
        title: /вступительн/i.test(exam) ? `Сдать вступительные экзамены факультета (${u.name})` : `Сдать вступительный экзамен ${exam.split(" / ")[0]} (${u.name})`,
        description: /NUET/.test(exam) ? "NUET проверяет математику и критическое мышление. Вместо него можно сдать SAT." : "Проверь даты сессий на сайте вуза и зарегистрируйся заранее.",
        due_date: t.nextDeadline ? addDays(t.nextDeadline.date, 30) : before(20),
        priority: 1,
        university_id: u.id,
      });
    }
  }

  // ---------------------------------------------------------------- foundation
  const foundation = targets.filter((t) => t.university.requires_foundation && (p.grade == null || p.grade <= 11));
  if (foundation.length) {
    add({
      step_key: "doc-foundation",
      category: "application",
      title: "Выбрать и подать на подготовительный год (Foundation / Studienkolleg)",
      description: `Нужен для: ${foundation.map((t) => t.university.name).join(", ")}. Это +1 год к плану, но открывает прямое поступление.`,
      due_date: before(75),
      priority: 1,
    });
  }

  // ---------------------------------------------------------------- documents
  add({
    step_key: "doc-passport",
    category: "document",
    title: "Проверить загранпаспорт",
    description: "Срок действия — минимум на весь первый год учёбы. Оформление может занять до месяца.",
    due_date: addDays(todayIso, 30),
    priority: 2,
  });
  add({
    step_key: "doc-recommendations",
    category: "document",
    title: "Попросить 2 рекомендательных письма у учителей",
    description: "Лучше у учителей профильных предметов, которые хорошо тебя знают. Дай им 4–6 недель.",
    due_date: before(60),
    priority: 2,
  });
  add({
    step_key: "doc-essay-draft",
    category: "document",
    title: "Написать черновик мотивационного эссе",
    description: `Почему это направление, что уже сделано, какая цель${p.goal ? ` («${p.goal}»)` : ""}. AI-помощник поможет со структурой.`,
    due_date: before(50),
    priority: 1,
  });
  add({
    step_key: "doc-essay-final",
    category: "document",
    title: "Доработать эссе под каждый вуз",
    description: "Добавь в каждое эссе 2–3 предложения о конкретной программе и вузе. Попроси учителя английского вычитать текст.",
    due_date: before(20),
    priority: 1,
  });
  add({
    step_key: "doc-translations",
    category: "document",
    title: "Перевести и заверить аттестат и транскрипт",
    description: "Нотариальный перевод на английский. Для Чехии и Италии уточни требования к апостилю и признанию документов.",
    due_date: before(30),
    priority: 2,
  });
  if (targets.some((t) => t.university.slug === "charles")) {
    add({
      step_key: "doc-nostrification",
      category: "document",
      title: "Подать на нострификацию аттестата (Чехия)",
      description: "Без признания аттестата не зачислят. Процедура занимает до 30 дней.",
      due_date: `${startYear}-06-30`,
      priority: 2,
      university_id: targets.find((t) => t.university.slug === "charles")!.university.id,
    });
  }

  // ---------------------------------------------------------------- applications
  for (const t of targets) {
    if (!t.nextDeadline) continue;
    add({
      step_key: `apply-${t.university.slug}`,
      category: "application",
      title: `Подать заявку в ${t.university.name}`,
      description: `${t.nextDeadline.label} — ${formatDate(t.nextDeadline.date)}. Шанс сейчас ≈${t.chance}%. Подача на сайте вуза: ${t.university.admissions_url ?? t.university.website_url}`,
      due_date: t.nextDeadline.date,
      priority: 1,
      university_id: t.university.id,
    });
  }

  // ---------------------------------------------------------------- scholarships
  // Only scholarships tied to the target universities, or national programmes in their countries.
  const targetIds = new Set(targets.map((t) => t.university.id));
  const targetCountries = new Set(targets.map((t) => t.university.country_code));
  const planScholarships = scholarships.filter(
    (s) =>
      s.status !== "not" &&
      s.deadline &&
      (s.scholarship.university_id != null
        ? targetIds.has(s.scholarship.university_id)
        : p.needs_scholarship && s.scholarship.country_code != null && targetCountries.has(s.scholarship.country_code)),
  );
  for (const s of planScholarships) {
    const informational = s.scholarship.coverage === "tuition";
    add({
      step_key: `scholarship-${s.scholarship.slug}`,
      category: "scholarship",
      title: informational ? `Уточнить условия: ${s.scholarship.name}` : `Подать на стипендию: ${s.scholarship.name}`,
      description: `${s.scholarship.amount_note ?? ""}. ${s.gaps.length ? `Сначала: ${s.gaps.join("; ")}.` : "По профилю ты подходишь."}`.trim(),
      due_date: s.deadline!.date,
      priority: p.needs_scholarship ? 1 : 2,
      university_id: s.scholarship.university_id,
    });
  }
  if (targets.some((t) => t.scholarships.some((s) => s.need_based))) {
    add({
      step_key: "doc-financial",
      category: "document",
      title: "Собрать документы о доходах семьи",
      description: "Нужны для need-based помощи (например, CSS Profile для вузов США): справки о зарплате, налогах и расходах.",
      due_date: before(15),
      priority: 2,
    });
  }

  // ---------------------------------------------------------------- activities
  const olympiad = p.activities.some((a) => a.kind === "olympiad");
  const mainField = p.interests[0];
  if (!olympiad) {
    add({
      step_key: "activity-olympiad",
      category: "activity",
      title: `Принять участие в олимпиаде${mainField ? ` (${lowerFirst(FIELD_LABEL[mainField] ?? "")})` : ""}`,
      description: "Даже региональный уровень заметно усиливает заявку в конкурентные вузы.",
      due_date: addDays(todayIso, 90),
      priority: 2,
    });
  }
  if (mainField && ACTIVITY_IDEAS[mainField]) {
    add({
      step_key: `activity-project-${mainField}`,
      category: "activity",
      title: ACTIVITY_IDEAS[mainField].title,
      description: ACTIVITY_IDEAS[mainField].text,
      due_date: before(35),
      priority: activityStrength(p) < 3 ? 1 : 3,
    });
  }
  add({
    step_key: "activity-portfolio",
    category: "activity",
    title: "Собрать портфолио достижений",
    description: "Грамоты, сертификаты, ссылки на проекты — в одной папке. Пригодится для заявок и стипендий.",
    due_date: before(40),
    priority: 3,
  });

  // ---------------------------------------------------------------- after applying
  add({
    step_key: "finish-decision",
    category: "deadline",
    title: "Получить решения и выбрать вуз",
    description: "Сравни офферы и стипендии. Обычно на ответ дают до 1 мая.",
    due_date: `${startYear}-05-01`,
    priority: 2,
  });
  add({
    step_key: "doc-visa",
    category: "document",
    title: "Оформить студенческую визу",
    description: "После зачисления: приглашение от вуза, подтверждение средств, медстраховка. Подавать за 2–3 месяца до старта.",
    due_date: `${startYear}-06-15`,
    priority: 3,
  });

  // Keep dates realistic: nothing in the past, preparation never after its deadline.
  let bump = 0;
  const normalized = steps.map((s) => {
    if (s.due_date && s.due_date < todayIso) {
      bump += 2;
      return { ...s, due_date: addDays(todayIso, 3 + bump), description: `Сделай как можно скорее — до первого дедлайна осталось мало времени. ${s.description}` };
    }
    return s;
  });

  const seen = new Set<string>();
  return normalized
    .filter((s) => (seen.has(s.step_key) ? false : (seen.add(s.step_key), true)))
    .sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999") || a.priority - b.priority);
}

/** Pick the single most important thing to do now. */
export function pickNextAction<T extends { status: string; due_date: string | null; priority: number }>(steps: T[], today = new Date()): T | null {
  const todayIso = toIso(today);
  const open = steps.filter((s) => s.status === "todo" || s.status === "in_progress");
  if (!open.length) return null;
  const weight = (s: T) => {
    const overdue = s.due_date != null && s.due_date < todayIso;
    return [s.status === "in_progress" ? 0 : 1, overdue ? 0 : 1, s.due_date ?? "9999", s.priority] as const;
  };
  return [...open].sort((a, b) => {
    const wa = weight(a);
    const wb = weight(b);
    return wa[0] - wb[0] || wa[1] - wb[1] || wa[2].localeCompare(wb[2]) || wa[3] - wb[3];
  })[0];
}

// UniRoute · src/lib/engine/roadmap.ts
