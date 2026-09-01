import type { Specialist } from '../data/specialists'
import { escapeHtml, todayRu } from './utils'

function yesNo(): string {
  return `<span class="blank-asq-yn"><i></i> Да</span><span class="blank-asq-yn"><i></i> Нет</span>`
}

function writeLines(count: number): string {
  return Array.from({ length: count }, () => `<div class="blank-asq-line"></div>`).join('')
}

/** Официальная методика скрининга ASQ (приказ Минздрава РБ №1351) — только для печати ASQ */
export function buildAsqScreeningDocHtml(specialist: Specialist): string {
  return `<div class="blank-sheet blank-asq-screening">
  <p class="blank-asq-order">Приказ Министерства здравоохранения Республики Беларусь<br>11.11.2025 №1351</p>
  <h1 class="blank-asq-title">Методика для скрининга на риск самоубийства<br><span>(Ask suicide-screening questions)</span></h1>
  <p class="blank-asq-prompt"><strong>СПРОСИТЕ ПАЦИЕНТА:</strong></p>

  <div class="blank-asq-q">
    <div class="blank-asq-qhead"><span class="blank-asq-num">1.</span> За последние несколько недель хотелось ли Вам умереть?</div>
    <div class="blank-asq-opts">${yesNo()}</div>
  </div>

  <div class="blank-asq-q">
    <div class="blank-asq-qhead"><span class="blank-asq-num">2.</span> За последние несколько недель чувствовали ли Вы, что Вам или Вашей семье было бы лучше, если бы Вы умерли?</div>
    <div class="blank-asq-opts">${yesNo()}</div>
  </div>

  <div class="blank-asq-q">
    <div class="blank-asq-qhead"><span class="blank-asq-num">3.</span> За последнюю неделю были ли у Вас мысли о самоубийстве?</div>
    <div class="blank-asq-opts">${yesNo()}</div>
  </div>

  <div class="blank-asq-q blank-asq-q-extended">
    <div class="blank-asq-qhead"><span class="blank-asq-num">4.</span> Вы когда-нибудь пытались убить себя?</div>
    <p class="blank-asq-sub">Если да, то каким образом?</p>
    ${writeLines(3)}
    <p class="blank-asq-sub">Когда?</p>
    <div class="blank-asq-opts">${yesNo()}</div>
  </div>

  <p class="blank-asq-bridge">Если пациент отвечает «да» на любой из вышеперечисленных вопросов, задайте ему (ей) следующий вопрос для определения остроты ситуации:</p>

  <div class="blank-asq-q blank-asq-q-extended">
    <div class="blank-asq-qhead"><span class="blank-asq-num">5.</span> Думаете ли Вы о том, чтобы убить себя прямо сейчас?</div>
    <p class="blank-asq-sub">Если да, опишите, пожалуйста, свои мысли</p>
    ${writeLines(22)}
    <div class="blank-asq-opts">${yesNo()}</div>
  </div>

  <div class="blank-footer blank-asq-footer">
    <span>${escapeHtml(todayRu())}</span>
    <span>${escapeHtml(specialist.title)} ________ ${escapeHtml(specialist.fullName)}</span>
  </div>
</div>`
}
