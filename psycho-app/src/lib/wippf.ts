import type { Level } from '../types'

/** Диапазон сырых баллов одной шкалы (3 пункта × 1–4) */
export const WIPPF_SCALE_MIN = 3
export const WIPPF_SCALE_MAX = 12
export const WIPPF_CUT_LOW = 5
export const WIPPF_CUT_HIGH = 10

export type WippfBand = Level

export interface WippfScaleDef {
  id: string
  code: string
  name: string
  group: 'secondary' | 'primary' | 'conflict' | 'model'
  /** 0-based индексы пунктов (по 3); порядок a/r/k или e/w/i */
  items: [number, number, number]
  lowPole: string
  highPole: string
}

/**
 * Ключ WIPPF 2.0 (на основе формы Б Пезешкиана/Дайденбаха + Remmers):
 * пункты 1-based → здесь 0-based. Пункт 1 (инструкция) не входит в шкалы.
 * I–другие: пункты 86–88 (добавление 2.0).
 */
export const WIPPF_SCALES: WippfScaleDef[] = [
  // —— Вторичные способности ——
  {
    id: 'order',
    code: 'Пор',
    name: 'Порядок / аккуратность',
    group: 'secondary',
    items: [2, 39, 71],
    lowPole: 'беспорядок, небрежность',
    highPole: 'педантичность, потребность в «стерильном» порядке',
  },
  {
    id: 'clean',
    code: 'Чист',
    name: 'Чистоплотность / опрятность',
    group: 'secondary',
    items: [13, 55, 66],
    lowPole: 'неряшливость',
    highPole: 'избыточное внимание к чистоте',
  },
  {
    id: 'punct',
    code: 'Пункт',
    name: 'Пунктуальность',
    group: 'secondary',
    items: [36, 47, 56],
    lowPole: 'постоянные опоздания',
    highPole: 'точность до минуты',
  },
  {
    id: 'polite',
    code: 'Вежл',
    name: 'Вежливость',
    group: 'secondary',
    items: [12, 40, 69],
    lowPole: 'бестактность, дерзость',
    highPole: 'сверхдружелюбие, трудность сказать «нет»',
  },
  {
    id: 'honest',
    code: 'Честн',
    name: 'Честность / открытость',
    group: 'secondary',
    items: [8, 43, 84],
    lowPole: 'скрытность, неискренность',
    highPole: 'избыточная прямота, «что на уме — то на языке»',
  },
  {
    id: 'achieve',
    code: 'Усерд',
    name: 'Усердие / достижения',
    group: 'secondary',
    items: [28, 44, 79],
    lowPole: 'лень, праздность',
    highPole: 'карьеризм, рвение',
  },
  {
    id: 'reliable',
    code: 'Обяз',
    name: 'Обязательность / надёжность',
    group: 'secondary',
    items: [5, 41, 67],
    lowPole: 'необязательность',
    highPole: 'скрупулёзность, безусловное выполнение обещаний',
  },
  {
    id: 'thrift',
    code: 'Береж',
    name: 'Бережливость',
    group: 'secondary',
    items: [7, 24, 65],
    lowPole: 'расточительность',
    highPole: 'скупость, аскетизм',
  },
  {
    id: 'obey',
    code: 'Посл',
    name: 'Послушание',
    group: 'secondary',
    items: [15, 45, 59],
    lowPole: 'бунт, отрицание авторитетов',
    highPole: 'слепое подчинение / жёсткость к подчинённым',
  },
  {
    id: 'justice',
    code: 'Справ',
    name: 'Справедливость',
    group: 'secondary',
    items: [26, 64, 80],
    lowPole: 'игнор справедливости ради симпатий',
    highPole: 'жажда справедливости',
  },
  {
    id: 'faithful',
    code: 'Верн',
    name: 'Верность',
    group: 'secondary',
    items: [6, 34, 52],
    lowPole: 'неверность, смена установок',
    highPole: 'ригидность, «пока смерть не разлучит»',
  },
  // —— Первичные способности ——
  {
    id: 'patience',
    code: 'Терп',
    name: 'Терпение',
    group: 'primary',
    items: [14, 22, 37],
    lowPole: 'нетерпеливость',
    highPole: 'сверхтерпение, откладывание своих нужд',
  },
  {
    id: 'time',
    code: 'Время',
    name: 'Время',
    group: 'primary',
    items: [20, 46, 72],
    lowPole: 'дефицит времени, перегрузки',
    highPole: 'расточительное времяпрепровождение',
  },
  {
    id: 'contact',
    code: 'Конт',
    name: 'Контакты',
    group: 'primary',
    items: [29, 61, 77],
    lowPole: 'застенчивость, трудность контакта',
    highPole: 'избыточная коммуникабельность',
  },
  {
    id: 'trust',
    code: 'Довер',
    name: 'Доверие',
    group: 'primary',
    items: [17, 27, 62],
    lowPole: 'недоверие, подозрительность',
    highPole: 'наивное доверие',
  },
  {
    id: 'hope',
    code: 'Надеж',
    name: 'Надежда',
    group: 'primary',
    items: [9, 23, 68],
    lowPole: 'пессимизм, безнадёжность',
    highPole: 'безоглядный оптимизм',
  },
  {
    id: 'tenderness',
    code: 'Нежн',
    name: 'Нежность / сексуальность',
    group: 'primary',
    items: [16, 58, 82],
    lowPole: 'холодность, страх телесного контакта',
    highPole: 'преувеличение роли сексуальности',
  },
  {
    id: 'love',
    code: 'Любов',
    name: 'Любовь / принятие',
    group: 'primary',
    items: [30, 60, 75],
    lowPole: 'дистанцированность, отвержение',
    highPole: '«материнская» позиция, потакание',
  },
  {
    id: 'faith',
    code: 'Вера',
    name: 'Вера / смысл',
    group: 'primary',
    items: [21, 35, 53],
    lowPole: 'индифферентность к смыслу',
    highPole: 'фанатичный интерес к мировоззрению',
  },
  // —— Конфликтные реакции ——
  {
    id: 'body',
    code: 'Тело',
    name: 'Тело / ощущения',
    group: 'conflict',
    items: [1, 49, 76],
    lowPole: 'бегство в гиперактивность / расслабление',
    highPole: 'бегство в болезнь, психосоматика',
  },
  {
    id: 'work',
    code: 'Деят',
    name: 'Деятельность / работа',
    group: 'conflict',
    items: [11, 51, 70],
    lowPole: 'бегство в бездеятельность',
    highPole: 'бегство в работу',
  },
  {
    id: 'contactRx',
    code: 'К-конф',
    name: 'Контакты (в конфликте)',
    group: 'conflict',
    items: [19, 50, 81],
    lowPole: 'бегство в одиночество',
    highPole: 'бегство в общение',
  },
  {
    id: 'fantasy',
    code: 'Фант',
    name: 'Фантазия / смысл',
    group: 'conflict',
    items: [4, 32, 57],
    lowPole: 'негативные катастрофические мысли',
    highPole: 'бегство в фантазии',
  },
  // —— Модельные измерения ——
  {
    id: 'iMother',
    code: 'Я–М',
    name: 'Я — мать',
    group: 'model',
    items: [33, 63, 83],
    lowPole: 'дистанция / холодность',
    highPole: 'тепло / привязанность',
  },
  {
    id: 'iFather',
    code: 'Я–О',
    name: 'Я — отец',
    group: 'model',
    items: [18, 48, 74],
    lowPole: 'дистанция / холодность',
    highPole: 'тепло / привязанность',
  },
  {
    id: 'iOthers',
    code: 'Я–Др',
    name: 'Я — другие (воспитатели)',
    group: 'model',
    items: [85, 86, 87],
    lowPole: 'мало значимых фигур вне родителей',
    highPole: 'важная фигура вне родителей',
  },
  {
    id: 'you',
    code: 'Ты',
    name: 'Ты (союз родителей)',
    group: 'model',
    items: [10, 31, 42],
    lowPole: 'конфликтный / холодный союз',
    highPole: 'гармоничный / близкий союз',
  },
  {
    id: 'we',
    code: 'Мы',
    name: 'Мы (родители — мир)',
    group: 'model',
    items: [3, 38, 73],
    lowPole: 'замкнутость родителей',
    highPole: 'открытость, общительность',
  },
  {
    id: 'praWe',
    code: 'Пра-Мы',
    name: 'Пра-Мы (ценности родителей)',
    group: 'model',
    items: [25, 54, 78],
    lowPole: 'индифферентность к смыслу',
    highPole: 'сильные мировоззренческие идеалы',
  },
]

export interface WippfScaleScore {
  id: string
  code: string
  name: string
  group: WippfScaleDef['group']
  score: number
  level: WippfBand
  flag: string
  lowPole: string
  highPole: string
  /** a/r/k или e/w/i по пунктам шкалы */
  dims: [number, number, number]
}

export interface WippfAgg {
  id: string
  name: string
  value: number
  min: number
  max: number
  hint: string
}

export interface WippfReport {
  scales: WippfScaleScore[]
  secondary: WippfScaleScore[]
  primary: WippfScaleScore[]
  conflict: WippfScaleScore[]
  model: WippfScaleScore[]
  extremes: WippfScaleScore[]
  high: WippfScaleScore[]
  low: WippfScaleScore[]
  agg: WippfAgg[]
  level: WippfBand
  verdict: string
  conclusion: string
  /** Краткая строка для сводки / копирования */
  summary: string
}

export function wippfBand(score: number): WippfBand {
  if (score >= WIPPF_CUT_HIGH) return 'high'
  if (score <= WIPPF_CUT_LOW) return 'low'
  return 'moderate'
}

function flagOf(level: WippfBand): string {
  if (level === 'high') return 'выражено'
  if (level === 'low') return 'слабо'
  return 'баланс'
}

/**
 * Полный разбор WIPPF 2.0.
 * Ответы: 1 = нет … 4 = да (как в оригинале).
 */
export function computeWippf(answers: number[]): WippfReport {
  const scales: WippfScaleScore[] = WIPPF_SCALES.map((def) => {
    const dims: [number, number, number] = [
      answers[def.items[0]] ?? 0,
      answers[def.items[1]] ?? 0,
      answers[def.items[2]] ?? 0,
    ]
    const score = dims[0] + dims[1] + dims[2]
    const level = wippfBand(score)
    return {
      id: def.id,
      code: def.code,
      name: def.name,
      group: def.group,
      score,
      level,
      flag: flagOf(level),
      lowPole: def.lowPole,
      highPole: def.highPole,
      dims,
    }
  })

  const secondary = scales.filter((s) => s.group === 'secondary')
  const primary = scales.filter((s) => s.group === 'primary')
  const conflict = scales.filter((s) => s.group === 'conflict')
  const model = scales.filter((s) => s.group === 'model')
  const high = scales.filter((s) => s.level === 'high')
  const low = scales.filter((s) => s.level === 'low')
  const extremes = [...high, ...low]

  // a / r / k — суммы по 11 вторичным (каждая шкала: dims[0]=a, [1]=r, [2]=k)
  const a = secondary.reduce((s, x) => s + x.dims[0], 0)
  const r = secondary.reduce((s, x) => s + x.dims[1], 0)
  const k = secondary.reduce((s, x) => s + x.dims[2], 0)
  // e / w / i — по 8 первичным
  const e = primary.reduce((s, x) => s + x.dims[0], 0)
  const w = primary.reduce((s, x) => s + x.dims[1], 0)
  const i = primary.reduce((s, x) => s + x.dims[2], 0)

  const agg: WippfAgg[] = [
    { id: 'a', name: 'Своё поведение (a)', value: a, min: 11, max: 44, hint: 'как я сам(а) соблюдаю нормы' },
    { id: 'r', name: 'Ожидания от других (r)', value: r, min: 11, max: 44, hint: 'чего жду от окружающих' },
    { id: 'k', name: 'Идеалы / принципы (k)', value: k, min: 11, max: 44, hint: 'какими «должны быть» нормы' },
    { id: 'e', name: 'К себе (e)', value: e, min: 8, max: 32, hint: 'первичные способности к себе' },
    { id: 'w', name: 'К другим (w)', value: w, min: 8, max: 32, hint: 'первичные способности к другим' },
    { id: 'i', name: 'Как идеал (i)', value: i, min: 8, max: 32, hint: 'значение качеств как идеала' },
  ]

  const conflictTop = [...conflict].sort((x, y) => y.score - x.score)[0]

  let level: WippfBand = 'moderate'
  if (extremes.length >= 8) level = 'high'
  else if (extremes.length <= 2) level = 'low'

  let verdict: string
  if (extremes.length === 0) {
    verdict = 'Профиль относительно сбалансирован'
  } else if (high.length && !low.length) {
    verdict = 'Есть выраженные ценности / полюса'
  } else if (low.length && !high.length) {
    verdict = 'Есть слабо выраженные способности'
  } else {
    verdict = 'Есть контрастные полюса профиля'
  }

  const extremeText = extremes.length
    ? extremes
        .slice(0, 8)
        .map((s) => `${s.code} ${s.score} (${s.flag})`)
        .join('; ')
    : 'без крайних шкал'

  const conclusion =
    `Ориентиры: 3–5 слабо, 6–9 баланс, 10–12 выражено. ` +
    (conflictTop
      ? `В конфликте заметнее всего: ${conflictTop.name} (${conflictTop.score}/12). `
      : '') +
    `Крайние шкалы: ${extremeText}. ` +
    `Сравнение норм: a=${a}, r=${r}, k=${k} (11–44); отношений: e=${e}, w=${w}, i=${i} (8–32).`

  const summary =
    `WIPPF 2.0: ${verdict.toLowerCase()}. ` +
    `Крайних шкал ${extremes.length} (↑${high.length} / ↓${low.length}). ` +
    (conflictTop ? `Конфликт: ${conflictTop.code} ${conflictTop.score}/12. ` : '') +
    `a/r/k ${a}/${r}/${k}; e/w/i ${e}/${w}/${i}.`

  return {
    scales,
    secondary,
    primary,
    conflict,
    model,
    extremes,
    high,
    low,
    agg,
    level,
    verdict,
    conclusion,
    summary,
  }
}

/** Короткая строка для TestConfig.score / сводки */
export function scoreWippf(answers: number[]): string {
  return computeWippf(answers).summary
}
