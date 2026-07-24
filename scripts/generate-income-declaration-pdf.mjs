#!/usr/bin/env node
// Renders scripts/pdf-templates/income-declaration.html to a static PDF at
// public/forms/income-declaration-form.pdf. Re-run whenever the template
// content changes; the generated PDF is what /oes/secondary/portal links to.
import { chromium } from "playwright"
import { fileURLToPath } from "node:url"
import path from "node:path"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const templatePath = path.join(__dirname, "pdf-templates", "income-declaration.html")
const outPath = path.join(__dirname, "..", "public", "forms", "income-declaration-form.pdf")

const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto(`file:///${templatePath.replace(/\\/g, "/")}`)
await page.pdf({
  path: outPath,
  format: "A4",
  margin: { top: "0mm", bottom: "0mm", left: "0mm", right: "0mm" },
  printBackground: true,
})
await browser.close()

console.log(`Generated ${outPath}`)
