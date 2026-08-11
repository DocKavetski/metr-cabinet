import { depressionTests } from './depression'
import { anxietyTests } from './anxiety'
import { bipolarTests } from './bipolar'
import { sleepTests } from './sleep'
import { adhdTests } from './adhd'
import { autismTests } from './autism'
import { ptsdOcdTests } from './ptsd_ocd'
import { sexologyTests } from './sexology'
import { suicideTests } from './suicide'
import { cognitiveTests } from './cognitive'
import { personalityTests } from './personality'
import { substanceTests } from './substance'
import { eatingSocialPanicTests } from './eating_social_panic'
import { dissociationFunctionTests } from './dissociation_function'
import { traumaTests } from './trauma'
import type { TestConfig } from '../types'

export const categoryOrder = [
  'Депрессия',
  'Тревога',
  'Биполярный спектр',
  'Сон',
  'СДВГ',
  'РАС',
  'ПТСР',
  'ОКР',
  'Травма',
  'Зависимости',
  'Пищевое поведение',
  'Диссоциация',
  'Сексология',
  'Суицидальный риск',
  'Функционирование',
  'Когнитивные',
  'Личностные',
] as const

export const allTests: TestConfig[] = [
  ...depressionTests,
  ...anxietyTests,
  ...eatingSocialPanicTests,
  ...bipolarTests,
  ...sleepTests,
  ...adhdTests,
  ...autismTests,
  ...ptsdOcdTests,
  ...traumaTests,
  ...substanceTests,
  ...dissociationFunctionTests,
  ...sexologyTests,
  ...suicideTests,
  ...cognitiveTests,
  ...personalityTests,
]

export { specialists, defaultSpecialistId, getSpecialist } from './specialists'
export type { Specialist } from './specialists'
export { freeBlanks, getFreeBlank, isFreeOfficialBlank, originalBlankHref } from './freeBlanks'
export type { FreeBlankInfo } from './freeBlanks'
export { yesNo, ASQ_ACUITY_BLANK } from './options'
export { testMatchesQuery } from './search'

export const testsById: Record<string, TestConfig> = Object.fromEntries(
  allTests.map((t) => [t.id, t]),
)

export function getTest(id: string): TestConfig | undefined {
  return testsById[id]
}

/** Блок «Первичный приём» — всегда первый в сайдбаре */
export const primaryIntakeIds = ['hads', 'asq'] as const

export function primaryIntakeTests(): TestConfig[] {
  return primaryIntakeIds.map((id) => getTest(id)).filter(Boolean) as TestConfig[]
}
