// scripts/build-hs-data.mjs
// HS nomenklatür (Armonize Sistem) veri setini indirir → src/lib/grounding/data/hs-nomenclature.json
// Kaynak: https://datahub.io/core/harmonized-system (CC-BY). Kolonlar: section,hscode,description,parent,level
import { writeFile, mkdir, readFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { existsSync } from 'node:fs'

const CSV_URL = 'https://raw.githubusercontent.com/datasets/harmonized-system/main/data/harmonized-system.csv'
const LOCAL_CSV = 'scripts/harmonized-system.csv'
const OUT = 'src/lib/grounding/data/hs-nomenclature.json'

function parseCsv(text) {
  const rows = []
  const lines = text.split(/\r?\n/).filter(Boolean)
  const header = lines[0].split(',')
  const idx = (n) => header.indexOf(n)
  for (let i = 1; i < lines.length; i++) {
    // basit CSV: description tırnak içinde virgül içerebilir
    const m = lines[i].match(/("([^"]|"")*"|[^,]*)(,|$)/g)
    if (!m) continue
    const cols = m.map((c) => c.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"').trim())
    const code = cols[idx('hscode')]
    const description = cols[idx('description')]
    if (!code || !description) continue
    const digits = code.replace(/\D/g, '')
    if (![2, 4, 6].includes(digits.length)) continue
    rows.push({ code: digits, description, level: digits.length })
  }
  return rows
}

let text
if (existsSync(LOCAL_CSV)) {
  console.log('Yerel CSV kullanılıyor:', LOCAL_CSV)
  text = await readFile(LOCAL_CSV, 'utf8')
} else {
  const res = await fetch(CSV_URL)
  if (!res.ok) {
    console.error('HS veri seti indirilemedi:', res.status, '\nManuel: CSV indir, scripts/harmonized-system.csv olarak kaydet, tekrar çalıştır.')
    process.exit(1)
  }
  text = await res.text()
}

const rows = parseCsv(text)
if (rows.length < 1000) {
  console.error('Beklenenden az satır:', rows.length, '— parse hatalı olabilir.')
  process.exit(1)
}
await mkdir(dirname(OUT), { recursive: true })
await writeFile(OUT, JSON.stringify(rows))
console.log('Yazıldı:', OUT, rows.length, 'kalem')
