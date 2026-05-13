import 'dotenv/config'
import * as fs from 'fs'
import * as path from 'path'
import { runAnalysis, toJSON } from './service'
import { toMarkdown } from './reports/markdown'
import { createLLMClient } from './llm'
import type { CollectorOutput } from './types'

async function main(): Promise<void> {
  const arg = process.argv[2]
  if (!arg) {
    console.error('Uso: npm run analyze -- <ruta-al-collector-output.json>')
    console.error('Ejemplo: npm run analyze -- ../collector/outputs/peluqueria-udos.raw-business-data.json')
    process.exit(1)
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('[analyst] ANTHROPIC_API_KEY no configurada. Ver .env.example')
    process.exit(1)
  }

  let raw: CollectorOutput
  try {
    const filePath = path.resolve(arg)
    raw = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as CollectorOutput
  } catch (e) {
    console.error(`[analyst] Error leyendo input: ${(e as Error).message}`)
    process.exit(1)
  }

  if (!raw.case_id) {
    console.error('[analyst] El input debe tener case_id')
    process.exit(1)
  }

  console.error(`[analyst] Iniciando análisis para case_id="${raw.case_id}"`)
  const start = Date.now()

  const llm = createLLMClient(apiKey)

  try {
    const analysis = await runAnalysis(raw, llm)
    const elapsed = ((Date.now() - start) / 1000).toFixed(1)

    const outputDir = path.resolve('./outputs')
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

    const jsonFile = path.join(outputDir, `${raw.case_id}-analysis.json`)
    const mdFile = path.join(outputDir, `${raw.case_id}-report.md`)

    fs.writeFileSync(jsonFile, JSON.stringify(toJSON(analysis), null, 2))
    fs.writeFileSync(mdFile, toMarkdown(analysis))

    console.error(`[analyst] Completado en ${elapsed}s`)
    console.error(`[analyst] JSON: ${jsonFile}`)
    console.error(`[analyst] Markdown: ${mdFile}`)
    console.error(`[analyst] Confianza: ${analysis.confidence_level} | Estado: ${analysis.human_review_status}`)
    console.error(`[analyst] Datos pendientes: ${analysis.required_data.length}`)

    process.stdout.write(JSON.stringify(toJSON(analysis), null, 2) + '\n')
  } catch (e) {
    console.error(`[analyst] Error fatal: ${(e as Error).message}`)
    process.exit(1)
  }
}

main()
