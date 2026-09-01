/**
 * Конвертирует официальные docx в HTML для печати (mammoth).
 * Запускается перед сборкой — печать совпадает с исходными документами.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mammoth from 'mammoth'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = path.resolve(root, '..')
const publicDir = path.join(root, 'public')
const outFile = path.join(root, 'src/generated/officialDocs.ts')

const DOCS = [
  {
    exportName: 'ASQ_SCREENING_HTML',
    publicFile: 'asq-screening.docx',
    sourceFile: 'Суициды Скрининг.docx',
    sheetClass: 'official-doc official-doc-asq',
  },
  {
    exportName: 'INFORMED_CONSENT_HTML',
    publicFile: 'informed-consent.docx',
    sourceFile: 'Информированное согласие.docx',
    sheetClass: 'official-doc official-doc-consent',
  },
]

const PRINT_CSS = `
@page { size: A4; margin: 20mm 18mm; }
body { margin: 0; color: #000; background: #fff; }
.official-doc {
  font-family: "Times New Roman", Times, serif;
  font-size: 12pt;
  line-height: 1.15;
  color: #000;
}
.official-doc p { margin: 0 0 6pt; }
.official-doc strong { font-weight: 700; }
.official-doc table {
  width: 100%;
  border-collapse: collapse;
  margin: 0 0 6pt;
}
.official-doc td,
.official-doc th {
  border: 1px solid #000;
  padding: 2pt 4pt;
  vertical-align: top;
}
.official-doc td p { margin: 0 0 3pt; }
.official-doc td p:last-child { margin-bottom: 0; }
.official-doc-asq > p:nth-child(-n+4) { text-align: center; }
.official-doc-asq > p:nth-child(5) { font-weight: 700; }
.official-doc-consent > p:nth-child(-n+2) { text-align: center; }
`

function wrapDoc(body, sheetClass) {
  return `<div class="blank-sheet ${sheetClass}"><style>${PRINT_CSS}</style>${body}</div>`
}

function escapeTsString(value) {
  return JSON.stringify(value)
}

async function convert(filePath, sheetClass) {
  const { value } = await mammoth.convertToHtml({ path: filePath })
  const body = injectPlaceholders(value, sheetClass)
  return wrapDoc(body, sheetClass)
}

const MONTHS =
  'января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря'

function injectPlaceholders(body, sheetClass) {
  let out = body
  if (sheetClass.includes('asq')) {
    out = out.replace(
      new RegExp(
        `\\d{1,2}\\s+(?:${MONTHS})\\s+\\d{4}\\s+г\\.\\s+Врач-психотерапевт\\s+[^<]+`,
        'i',
      ),
      '{{ASQ_FOOTER}}',
    )
  }
  if (sheetClass.includes('consent')) {
    out = out.replace(
      new RegExp(`<p>\\d{1,2}\\s+(?:${MONTHS})\\s+\\d{4}\\s+г\\.<\\/p>`, 'gi'),
      '<p>{{PRINT_DATE}}</p>',
    )
    out = out.replace(
      /<p>\(подпись врача-специалиста\)<\/p>/gi,
      '<p>{{DOCTOR_LINE}}</p><p>(подпись врача-специалиста)</p>',
    )
  }
  return out
}

const exports = []

for (const doc of DOCS) {
  const rootSrc = path.join(repoRoot, doc.sourceFile)
  const publicSrc = path.join(publicDir, doc.publicFile)
  const src = fs.existsSync(rootSrc) ? rootSrc : publicSrc
  if (!fs.existsSync(src)) {
    console.error(`Нет файла: ${rootSrc} или ${publicSrc}`)
    process.exit(1)
  }
  if (src === rootSrc) {
    fs.copyFileSync(rootSrc, publicSrc)
  }
  const html = await convert(src, doc.sheetClass)
  exports.push({ name: doc.exportName, html })
  console.log(`OK ${path.basename(src)} → ${doc.exportName} (${html.length} chars)`)
}

fs.mkdirSync(path.dirname(outFile), { recursive: true })
const ts = `/** Автогенерация: scripts/prepare-official-docs.mjs — не редактировать вручную */
${exports.map((e) => `export const ${e.name} = ${escapeTsString(e.html)}`).join('\n\n')}
`
fs.writeFileSync(outFile, ts)
console.log(`OK ${outFile}`)
