/**
 * Упаковывает папку «Расчет тестов» в ZIP в корне проекта —
 * удобно отправить себе на работу по почте.
 * Также синхронизирует docs/ для GitHub Pages.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const srcDir = path.join(root, 'Расчет тестов')
const zipPath = path.join(root, 'Расчет тестов.zip')
const docsDir = path.join(root, 'docs')

if (!fs.existsSync(srcDir)) {
  console.error('Нет папки:', srcDir)
  process.exit(1)
}
if (!fs.existsSync(path.join(srcDir, 'index.html'))) {
  console.error('В папке нет index.html — сначала выполните сборку.')
  process.exit(1)
}

fs.mkdirSync(docsDir, { recursive: true })
fs.copyFileSync(path.join(srcDir, 'index.html'), path.join(docsDir, 'index.html'))
const fav = path.join(srcDir, 'favicon.svg')
if (fs.existsSync(fav)) fs.copyFileSync(fav, path.join(docsDir, 'favicon.svg'))
fs.writeFileSync(path.join(docsDir, '.nojekyll'), '')
console.log('OK docs/ синхронизирован для GitHub Pages')

if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath)

// PowerShell Compress-Archive (Windows)
const ps = `
$ErrorActionPreference = 'Stop'
$src = ${JSON.stringify(srcDir)}
$dst = ${JSON.stringify(zipPath)}
if (Test-Path -LiteralPath $dst) { Remove-Item -LiteralPath $dst -Force }
Compress-Archive -LiteralPath $src -DestinationPath $dst -CompressionLevel Optimal
$item = Get-Item -LiteralPath $dst
Write-Output ("OK " + $item.FullName + " (" + [math]::Round($item.Length/1KB, 1) + " KB)")
`

try {
  execFileSync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-Command', ps],
    { stdio: 'inherit', cwd: root },
  )
} catch {
  console.error('Не удалось создать ZIP через PowerShell.')
  process.exit(1)
}
