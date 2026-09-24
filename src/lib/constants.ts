import type { AssistantStyle, ExamEntry, GpaScale, LanguageEntry } from "@/types/models";

export const FIELDS = [
  { id: "cs", label: "IT и программирование" },
  { id: "engineering", label: "Инженерия и робототехника" },
  { id: "math", label: "Математика и данные" },
  { id: "science", label: "Естественные науки" },
  { id: "medicine", label: "Медицина и биология" },
  { id: "business", label: "Бизнес и менеджмент" },
  { id: "economics", label: "Экономика и финансы" },
  { id: "law", label: "Право" },
  { id: "social", label: "Психология и общество" },
  { id: "humanities", label: "Гуманитарные науки" },
  { id: "design", label: "Дизайн" },
  { id: "architecture", label: "Архитектура" },
  { id: "arts", label: "Искусство" },
  { id: "media", label: "Медиа и журналистика" },
] as const;

export const FIELD_LABEL: Record<string, string> = Object.fromEntries(FIELDS.map((f) => [f.id, f.label]));

/** Countries we have universities for, with a one-line hint for the questionnaire. */
export const COUNTRIES = [
  { code: "US", name: "США", hint: "Сильнейшие вузы, дорого, но есть щедрая помощь" },
  { code: "CA", name: "Канада", hint: "Можно остаться работать после учёбы" },
  { code: "GB", name: "Великобритания", hint: "Бакалавриат за 3 года, нужен Foundation" },
  { code: "DE", name: "Германия", hint: "Почти бесплатно, но нужен Studienkolleg" },
  { code: "NL", name: "Нидерланды", hint: "Много программ на английском" },
  { code: "IT", name: "Италия", hint: "Низкая плата и стипендии по доходу" },
  { code: "CZ", name: "Чехия", hint: "Бесплатно на чешском языке" },
  { code: "KR", name: "Южная Корея", hint: "Полные стипендии для иностранцев" },
  { code: "SG", name: "Сингапур", hint: "Топ Азии, карьера в финансах и IT" },
  { code: "HK", name: "Гонконг", hint: "Английский язык, выход на рынок Азии" },
  { code: "AU", name: "Австралия", hint: "Можно работать во время учёбы" },
  { code: "TR", name: "Турция", hint: "Merit-стипендии до 100%" },
  { code: "KZ", name: "Казахстан", hint: "Грант покрывает обучение в NU" },
  { code: "CH", name: "Швейцария", hint: "Топовые технические вузы, дорогая жизнь" },
  { code: "FR", name: "Франция", hint: "Государственные вузы с невысокой платой" },
  { code: "ES", name: "Испания", hint: "Доступная жизнь, программы на английском растут" },
  { code: "IE", name: "Ирландия", hint: "Английский язык, IT-компании Европы" },
  { code: "HU", name: "Венгрия", hint: "Stipendium Hungaricum для граждан СНГ" },
  { code: "PL", name: "Польша", hint: "Недорого, много программ на английском" },
  { code: "JP", name: "Япония", hint: "Стипендии MEXT, программы на английском" },
  { code: "CN", name: "Китай", hint: "Стипендии CSC, сильные технические вузы" },
  { code: "MY", name: "Малайзия", hint: "Недорого, филиалы британских вузов" },
  { code: "AE", name: "ОАЭ", hint: "Кампусы международных вузов, английский" },
  { code: "AT", name: "Австрия", hint: "Низкая плата, обучение в основном на немецком" },
  { code: "SE", name: "Швеция", hint: "Сильные технические вузы, стипендии Swedish Institute" },
  { code: "FI", name: "Финляндия", hint: "Программы на английском и стипендии вузов" },
  { code: "BE", name: "Бельгия", hint: "Невысокая плата, центр Европы" },
  { code: "PT", name: "Португалия", hint: "Недорогая жизнь и тёплый климат" },
  { code: "NZ", name: "Новая Зеландия", hint: "Спокойная страна, работа во время учёбы" },
  { code: "UZ", name: "Узбекистан", hint: "Филиалы британских и корейских вузов, недорого" },
] as const;

export const COUNTRY_NAME: Record<string, string> = Object.fromEntries(COUNTRIES.map((c) => [c.code, c.name]));

export const CITIZENSHIPS = [
  { code: "KZ", name: "Казахстан" },
  { code: "RU", name: "Россия" },
  { code: "UZ", name: "Узбекистан" },
  { code: "KG", name: "Кыргызстан" },
  { code: "BY", name: "Беларусь" },
  { code: "AZ", name: "Азербайджан" },
  { code: "AM", name: "Армения" },
  { code: "GE", name: "Грузия" },
  { code: "TJ", name: "Таджикистан" },
  { code: "MN", name: "Монголия" },
  { code: "OTHER", name: "Другая страна" },
] as const;

export const GRADES = [8, 9, 10, 11, 12] as const;

/** Allowed age in the questionnaire (the database checks the same range). */
export const AGE_MIN = 15;
export const AGE_MAX = 150;
export const ageError = (age: number | null | undefined) =>
  age != null && (!Number.isInteger(age) || age < AGE_MIN || age > AGE_MAX) ? "Возраст — от 15 до 150 лет" : null;
export const GRADE_LABEL: Record<number, string> = { 8: "8 класс", 9: "9 класс", 10: "10 класс", 11: "11 класс", 12: "Выпускник" };

export const GPA_SCALES: { value: GpaScale; label: string; max: number; step: number; example: string }[] = [
  { value: 5, label: "из 5", max: 5, step: 0.1, example: "например, 4.6" },
  { value: 4, label: "GPA 4.0", max: 4, step: 0.05, example: "например, 3.7" },
  { value: 10, label: "из 10", max: 10, step: 0.1, example: "например, 8.5" },
  { value: 100, label: "из 100", max: 100, step: 1, example: "например, 88" },
];

export const LANGUAGE_LEVELS: LanguageEntry["level"][] = ["A1", "A2", "B1", "B2", "C1", "C2", "native"];
export const LEVEL_LABEL: Record<LanguageEntry["level"], string> = {
  A1: "A1",
  A2: "A2",
  B1: "B1",
  B2: "B2",
  C1: "C1",
  C2: "C2",
  native: "Родной",
};

export const OTHER_LANGUAGES = ["Немецкий", "Французский", "Испанский", "Итальянский", "Чешский", "Корейский", "Японский", "Китайский", "Турецкий"];

export const EXAMS: {
  type: ExamEntry["type"];
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
  example: string;
}[] = [
  { type: "IELTS", label: "IELTS", hint: "Английский, 0–9, шаг 0.5", min: 0, max: 9, step: 0.5, example: "6.5" },
  { type: "TOEFL", label: "TOEFL iBT", hint: "Английский, 0–120", min: 0, max: 120, step: 1, example: "95" },
  { type: "Duolingo", label: "Duolingo English Test", hint: "Английский, 10–160, шаг 5", min: 10, max: 160, step: 5, example: "120" },
  { type: "SAT", label: "SAT", hint: "Математика + английский, 400–1600, шаг 10", min: 400, max: 1600, step: 10, example: "1350" },
  { type: "CSCA", label: "CSCA", hint: "Экзамен для вузов Китая, математика 0–100", min: 0, max: 100, step: 1, example: "75" },
  { type: "NUET", label: "NUET", hint: "Экзамен Назарбаев Университета, 0–240", min: 0, max: 240, step: 1, example: "180" },
  { type: "UNT", label: "ЕНТ", hint: "Единое национальное тестирование, 0–140", min: 0, max: 140, step: 1, example: "110" },
];

export const ACTIVITY_KINDS = [
  { kind: "olympiad", label: "Олимпиады", levels: ["школьный", "региональный", "национальный", "международный"] },
  { kind: "research", label: "Проекты и исследования" },
  { kind: "volunteering", label: "Волонтёрство" },
  { kind: "leadership", label: "Лидерство, школьный совет" },
  { kind: "sport", label: "Спорт" },
  { kind: "creative", label: "Творчество" },
  { kind: "work", label: "Стажировка или работа" },
] as const;

export const BUDGETS = [
  { value: 0, label: "Только с полной стипендией", short: "$0" },
  { value: 5000, label: "До $5 000 в год", short: "до $5k" },
  { value: 15000, label: "До $15 000 в год", short: "до $15k" },
  { value: 30000, label: "До $30 000 в год", short: "до $30k" },
  { value: 50000, label: "До $50 000 в год", short: "до $50k" },
  { value: 100000, label: "Больше $50 000 в год", short: "$50k+" },
] as const;

export const CONSTRAINTS = [
  { id: "english_only", label: "Только на английском", hint: "Не готов(а) учить новый язык для учёбы" },
  { id: "no_foundation", label: "Без подготовительного года", hint: "Foundation / Studienkolleg не рассматриваю" },
  { id: "no_sat", label: "Без SAT", hint: "Не планирую сдавать SAT" },
] as const;

export const GOAL_SUGGESTIONS = [
  "Работать в международной IT-компании",
  "Заниматься наукой и исследованиями",
  "Открыть свой бизнес",
  "Вернуться домой сильным специалистом",
  "Стать врачом",
];

export const ASSISTANT_STYLES: { id: AssistantStyle; label: string; description: string }[] = [
  { id: "friendly", label: "Дружеский", description: "Тепло, поддерживает и объясняет" },
  { id: "strict", label: "Строгий", description: "По делу, со сроками и без поблажек" },
];

/** Stored styles from before there were two ("mentor", "concise") map to the nearest tone. */
export const toAssistantStyle = (value: unknown): AssistantStyle => (value === "strict" || value === "concise" ? "strict" : "friendly");

export function startYearOptions(now = new Date()): number[] {
  // Bachelor intakes start in autumn: before August the nearest intake is this year's.
  const first = now.getMonth() >= 7 ? now.getFullYear() + 1 : now.getFullYear();
  return [first, first + 1, first + 2, first + 3];
}

/** The word a student types to confirm deleting their account (checked on the server too). */
export const DELETE_CONFIRMATION = "удалить";
// UniRoute · src/lib/constants.ts
