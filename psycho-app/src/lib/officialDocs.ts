import type { Specialist } from '../data/specialists'
import { ASQ_SCREENING_HTML, INFORMED_CONSENT_HTML } from '../generated/officialDocs'
import { escapeHtml, todayRuLong } from './utils'

function applySpecialist(html: string, specialist: Specialist): string {
  const date = todayRuLong()
  const title = escapeHtml(specialist.title)
  const name = escapeHtml(specialist.fullName)
  const asqFooter = `${date}                  ${title}                            ${name}`
  const doctorLine = `${title} ${name}`

  return html
    .replaceAll('{{ASQ_FOOTER}}', asqFooter)
    .replaceAll('{{PRINT_DATE}}', date)
    .replaceAll('{{DOCTOR_LINE}}', doctorLine)
}

export function getAsqScreeningHtml(specialist: Specialist): string {
  return applySpecialist(ASQ_SCREENING_HTML, specialist)
}

export function getInformedConsentHtml(specialist: Specialist): string {
  return applySpecialist(INFORMED_CONSENT_HTML, specialist)
}
