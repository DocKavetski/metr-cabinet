import type { TestConfig } from '../types'

/** Синонимы → id шкал (поиск в сайдбаре) */
const ALIAS_GROUPS: { keys: string[]; testIds: string[] }[] = [
  { keys: ['сдвг', 'adhd', 'адхд', 'вниман', 'гиперакт'], testIds: ['asrs', 'diva5'] },
  {
    keys: ['аутизм', 'рас', 'asd', 'aspie', 'аспер'],
    testIds: ['aq10', 'aq50', 'raadsr', 'catq'],
  },
  { keys: ['депресс', 'настроен', 'хандр'], testIds: ['bdi', 'phq9', 'hamd', 'madrs', 'gds15'] },
  { keys: ['тревог', 'anxiety', 'паник'], testIds: ['hads', 'gad7', 'bai', 'hama', 'pdss', 'spin', 'lsas'] },
  { keys: ['суицид', 'самоуб', 'asq', 'риск'], testIds: ['cssrs', 'hopeless', 'asq'] },
  { keys: ['сон', 'бессон', 'апноэ'], testIds: ['isi', 'epworth', 'stopbang', 'sleepapnea', 'psqi'] },
  { keys: ['травм', 'птср', 'ptsd', 'ace'], testIds: ['pcl5', 'ace', 'ctq'] },
  { keys: ['биполяр', 'мани'], testIds: ['hcl33', 'mdq', 'ymrs'] },
  { keys: ['приём', 'скрининг', 'intake'], testIds: ['phq9', 'gad7', 'asq', 'isi', 'audit'] },
]

const extraById = new Map<string, string>()
for (const g of ALIAS_GROUPS) {
  const blob = g.keys.join(' ')
  for (const id of g.testIds) {
    extraById.set(id, `${extraById.get(id) ?? ''} ${blob}`)
  }
}

export function testMatchesQuery(test: TestConfig, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const hay = `${test.label} ${test.category} ${test.badge} ${test.id} ${extraById.get(test.id) ?? ''}`.toLowerCase()
  if (hay.includes(q)) return true
  for (const g of ALIAS_GROUPS) {
    if (g.keys.some((k) => k.includes(q) || q.includes(k)) && g.testIds.includes(test.id)) {
      return true
    }
  }
  return false
}
