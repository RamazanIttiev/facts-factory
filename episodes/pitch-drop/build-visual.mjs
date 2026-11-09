import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const slug = "pitch-drop";
const ru = JSON.parse(readFileSync(`episodes/${slug}/ru.json`, "utf8"));
const clean = (w) => w.replace(/[^\p{L}\p{N}-]/gu, "").toLowerCase();

const realWords = () => {
  try {
    const out = execSync(`npm run -s words -- ${slug}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return Object.fromEntries(
      out.split("# ").filter(Boolean).map((block) => {
        const [head, body = ""] = block.split("\n");
        const words = body.trim().split(" ").filter(Boolean).map((t) => {
          const m = t.match(/^\d+\.(.*)@([\d.]+)$/);
          return { text: m[1], from: Number(m[2]) };
        });
        return [head.split(" ")[0], { duration: Number(head.split(" ")[2].replace("s", "")), words }];
      }),
    );
  } catch {
    return {};
  }
};

const real = realWords();
const wordsOf = (id) =>
  real[id]?.words ?? ru.scenes[id].narration.split(/\s+/).map((t, i) => ({ text: clean(t), from: i / 2.5 }));

const timeOf = (id, anchor) => {
  if (typeof anchor === "number") return anchor;
  const [word, nth = 1] = anchor.split("#");
  const hits = wordsOf(id).filter((w) => w.text === word);
  const hit = hits[Number(nth) - 1];
  if (!hit) throw new Error(`${id}: word "${anchor}" not found`);
  return Math.max(0.2, Math.round((hit.from - 0.12) * 10) / 10);
};

const PEK = (at = 0.2) => [
  { kind: "thing", at, name: "desk", x: 0.6 },
  { kind: "thing", at: at + 0.3, name: "sign", x: 0.6, y: 190, text: "ПЕК" },
];
const sign = (at, text, until) => ({ kind: "thing", at, name: "sign", x: 0.5, y: 760, text, ...(until ? { until } : {}) });
const keeper = (at, extra = {}) => ({ kind: "person", id: "keeper", at, x: 0.25, look: ["glasses", "mustache"], mood: "flat", label: "МЕЙНСТОУН", ...extra });

const spec = {
  idea: {
    title: "АВСТРАЛИЯ, 1927",
    items: (t) => [
      { kind: "thing", at: 0.2, name: "calendar", x: 0.15, text: "1927", sub: "ГОД" },
      { kind: "person", id: "parnell", at: t("физик"), x: 0.3, look: ["glasses", "tie"], mood: "smile", arm: "point", label: "ПАРНЕЛЛ" },
      { kind: "thing", at: t("университета"), name: "building", x: 0.78, text: "КВИНСЛЕНД" },
      { kind: "say", at: t("показать"), who: "parnell", text: "СМОТРИТЕ, СТУДЕНТЫ", dx: 60, until: t("некоторые") },
      sign(t("некоторые"), "ВЫГЛЯДИТ…", t("твёрдыми")),
      sign(t("твёрдыми"), "ТВЁРДЫМ", t("деле")),
      sign(t("деле"), "НО ЭТО ЖИДКОСТЬ", t("греет")),
      sign(t("греет"), "ПЕК = ЧЁРНАЯ СМОЛА", t("заливает")),
      sign(t("заливает"), "В ВОРОНКУ", t("ждёт")),
      sign(t("ждёт"), "ПУСТЬ ОСЯДЕТ", t("три")),
      sign(t("три"), "ТРИ ГОДА"),
      { kind: "say", at: t("охренеть"), who: "parnell", text: "ПОДОЖДУ", dx: 60 },
    ],
  },
  cut: {
    title: "1930: ПОТЕКЛО",
    items: (t) => [
      ...PEK(),
      { kind: "thing", at: t("тридцатом"), name: "calendar", x: 0.15, text: "1930", sub: "ГОД" },
      sign(t("отрезают"), "ОТРЕЗАЛИ ГОРЛЫШКО", t("течь#2")),
      sign(t("течь#2"), "ТЕЧЁТ?", t("вязче")),
      sign(t("вязче"), "ВЯЗЧЕ ВОДЫ…", t("двести")),
      sign(t("двести"), "В 230 МЛРД РАЗ", t("одна")),
      sign(t("одна"), "КАПЛЯ РАЗ В ДЕСЯТЬ ЛЕТ", t("воронку")),
      sign(t("воронку"), "ПОД СТЕКЛЯННЫМ КОЛПАКОМ", t("самое")),
      sign(t("самое"), "САМОЕ СТРАННОЕ…", t("реалити-шоу")),
      sign(t("реалити-шоу"), "РЕАЛИТИ-ШОУ"),
    ],
  },
  keeper: {
    title: "СМОТРИТЕЛЬ КАПЛИ",
    items: (t) => [
      ...PEK(),
      { kind: "thing", at: t("шестьдесят"), name: "calendar", x: 0.15, text: "1961", sub: "ГОД" },
      sign(t("следующему"), "НОВЫЙ СМОТРИТЕЛЬ", t("шестьдесят")),
      keeper(t("джон")),
      { kind: "say", at: t("работа"), who: "keeper", text: "МОЯ РАБОТА: ЖДАТЬ", dx: 60, until: t("ебать") },
      sign(t("каплю"), "КАПЛЯ РАЗ В ДЕСЯТЬ ЛЕТ", t("ебать")),
      { kind: "say", at: t("ебать"), who: "keeper", text: "ЕБАТЬ…", dx: 60, until: t("график") },
      { kind: "say", at: t("график"), who: "keeper", text: "ВОТ ЭТО ГРАФИК", dx: 60 },
    ],
  },
  drink: {
    title: "3 ИЮЛЯ 1988",
    items: (t) => [
      ...PEK(),
      { kind: "thing", at: t("третье"), name: "calendar", x: 0.15, text: "1988", sub: "3 ИЮЛЯ" },
      keeper(t("мейнстоун"), { until: t("попить") }),
      sign(t("седьмая"), "СЕДЬМАЯ КАПЛЯ", t("вот-вот")),
      sign(t("вот-вот"), "ВОТ-ВОТ…", t("попить")),
      keeper(t("попить"), { id: "away", x: 0.08, face: "left", mood: "smile", label: "" }),
      { kind: "say", at: t("попить"), who: "away", text: "Я НА МИНУТКУ", dx: 80, until: t("падает") },
      sign(t("ровно"), "И РОВНО ТОГДА…", t("падает")),
      sign(t("падает"), "ПЛЮХ!", t("похоже")),
      sign(t("похоже"), "НИКТО НЕ ВИДЕЛ", t("проебано")),
      sign(t("проебано"), "ЗА ОДИН СТАКАН"),
      { kind: "say", at: t("десять"), who: "away", text: "СУКА!", dx: 80 },
    ],
  },
  camera: {
    title: "ПЛАН Б: КАМЕРА",
    items: (t) => [
      ...PEK(),
      { kind: "thing", at: t("веб-камера"), name: "camera", x: 0.85 },
      { kind: "thing", at: t("ноябре"), name: "calendar", x: 0.15, text: "2000", sub: "НОЯБРЬ" },
      sign(t("восьмая"), "ВОСЬМАЯ КАПЛЯ", t("технических")),
      sign(t("технических"), "ТЕХНИЧЕСКИЕ ПРОБЛЕМЫ", t("камера")),
      keeper(t("запись"), { mood: "sad" }),
      sign(t("камера"), "ЗАПИСИ НЕТ", t("техника")),
      { kind: "say", at: t("просрала"), who: "keeper", text: "НУ ЗАЕБИСЬ", dx: 60 },
      sign(t("техника"), "ТЕХНИКА!", t("страже")),
      sign(t("страже"), "НА СТРАЖЕ НАУКИ"),
    ],
  },
  dublin: {
    title: "ДУБЛИН, 2013",
    items: (t) => [
      { kind: "thing", at: t("дублине"), name: "building", x: 0.8, text: "ТРИНИТИ" },
      { kind: "thing", at: t("сорок"), name: "calendar", x: 0.15, text: "1944", sub: "ГОД", until: t("одиннадцатого") },
      ...PEK(t("воронка")).map((i) => ({ ...i, x: 0.45 })),
      { kind: "thing", at: t("одиннадцатого"), name: "calendar", x: 0.15, text: "2013", sub: "11 ИЮЛЯ" },
      sign(t("капля"), "КАПЛЯ!", t("впервые")),
      { kind: "thing", at: t("камеру"), name: "camera", x: 0.25 },
      sign(t("впервые"), "ВПЕРВЫЕ НА ВИДЕО", t("квинсленде")),
      sign(t("квинсленде"), "НЕ В КВИНСЛЕНДЕ", t("пиздец")),
      sign(t("пиздец"), "ПИЗДЕЦ ОБИДНО"),
    ],
  },
  end: {
    title: "ЧТО ДАЛЬШЕ",
    items: (t) => [
      ...PEK(),
      { kind: "thing", at: t("тринадцатого"), name: "calendar", x: 0.15, text: "2013", sub: "13 АВГУСТА", until: t("апреле") },
      keeper(0.3, { mood: "sad", until: t("девятая") }),
      sign(t("умирает"), "УМЕР В 78", t("девятая")),
      sign(t("девятая"), "ДЕВЯТАЯ КАПЛЯ", t("уже")),
      sign(t("уже"), "УЖЕ БЕЗ НЕГО", t("считается")),
      { kind: "thing", at: t("апреле"), name: "calendar", x: 0.15, text: "2014", sub: "АПРЕЛЬ" },
      { kind: "thing", at: t("считается"), name: "trophy", x: 0.85 },
      sign(t("считается"), "САМЫЙ ДОЛГИЙ…", t("лабораторным")),
      sign(t("лабораторным"), "ОПЫТ В МИРЕ", t("пека")),
      sign(t("пека"), "ПЕКА ХВАТИТ…", t("сто")),
      sign(t("сто"), "ЕЩЁ НА СТО ЛЕТ", t("если")),
      { kind: "person", id: "you", at: t("если"), x: 0.3, mood: "flat", label: "ТЫ" },
      { kind: "say", at: t("отходи"), who: "you", text: "НЕ ОТХОЖУ!", dx: 60, until: t("нихуя") },
      { kind: "say", at: t("нихуя"), who: "you", text: "НИХУЯ?", dx: 60, until: t("отвернёшься") },
      sign(t("отвернёшься"), "ПЛЮХ!"),
    ],
  },
};

const scenes = Object.keys(ru.scenes).map((id) => ({
  id,
  type: "doodle",
  title: spec[id].title,
  items: spec[id].items((a) => timeOf(id, a)),
}));
writeFileSync(`episodes/${slug}/visual.ru.json`, JSON.stringify({ slug, scenes }, null, 2) + "\n");
console.log(Object.keys(real).length ? "real word times" : "estimated word times");
