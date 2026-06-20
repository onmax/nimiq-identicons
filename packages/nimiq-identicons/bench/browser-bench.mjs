// Drives the playground Benchmark page in Chromium (Chrome engine) and WebKit
// (Safari engine) via Playwright, measuring how each generation strategy behaves
// on the main thread. Run the playground dev server first (`pnpm dev` at the
// repo root), then: `node packages/nimiq-identicons/bench/browser-bench.mjs`.
/* eslint-disable no-console -- this is a CLI benchmark; console is its output */
import process from 'node:process'
import { chromium, webkit } from 'playwright'

const URL = process.env.BENCH_URL ?? 'http://localhost:5173/'
const COUNTS = [10000, 50000]
const MODES = ['sync', 'batched', 'worker', 'cached']

async function runScenario(page, count, mode) {
  const countInput = page.locator('input[type=number]').first()
  await countInput.waitFor()
  await countInput.fill(String(count))
  await page.locator('select').first().selectOption(mode)

  const prev = await page.evaluate(() => window.__bench?.runId ?? 0)
  await page.getByRole('button', { name: /Render \d/ }).click({ noWaitAfter: true })
  try {
    await page.waitForFunction(p => (window.__bench?.runId ?? 0) > p, prev, { timeout: 120000 })
  }
  catch {
    return { mode, count, failed: true }
  }
  return page.evaluate(() => window.__bench)
}

async function benchEngine(name, browserType) {
  const browser = await browserType.launch()
  const page = await browser.newPage()
  await page.goto(URL, { waitUntil: 'load' })
  await page.getByText('Benchmark').click({ noWaitAfter: true })
  await page.getByRole('button', { name: /Render \d/ }).waitFor()

  // Isolate generation cost from DOM insertion (a consumer/virtualization concern).
  const imagesToggle = page.locator('label', { hasText: 'Insert images into the DOM' }).locator('input[type=checkbox]')
  if (await imagesToggle.isChecked())
    await imagesToggle.uncheck()
  // Output as base64 data-URI (the default <img> path).
  await page.locator('select').nth(1).selectOption('base64')

  const rows = []
  for (const count of COUNTS) {
    for (const mode of MODES)
      rows.push(await runScenario(page, count, mode))
  }
  await browser.close()
  return { name, rows }
}

function printTable({ name, rows }) {
  console.log(`\n=== ${name} ===`)
  console.log('count    mode      gen(ms)  thr(/s)    longTasks(ms)  worstFrameGap(ms)')
  for (const r of rows) {
    if (r.failed) {
      console.log(`${String(r.count).padEnd(8)} ${r.mode.padEnd(9)} FAILED`)
      continue
    }
    console.log(
      `${String(r.count).padEnd(8)} ${r.mode.padEnd(9)} `
      + `${String(r.genTime).padEnd(8)} ${String(r.throughput).padEnd(10)} `
      + `${`${r.longTaskCount} (${r.longTaskTotal})`.padEnd(14)} ${r.worstFrameGap}`,
    )
  }
}

async function main() {
  const results = []
  results.push(await benchEngine('Chromium (Chrome engine)', chromium))
  results.push(await benchEngine('WebKit (Safari engine)', webkit))
  results.forEach(printTable)
}

main()
