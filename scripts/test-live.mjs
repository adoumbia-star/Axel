import { mkdir } from 'node:fs/promises'
import puppeteer from 'puppeteer-core'

const url = process.argv[2]
if (!url) throw new Error('Usage: node scripts/test-live.mjs <url>')

const artifacts = '/opt/cursor/artifacts'
await mkdir(artifacts, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || '/usr/local/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})

const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 })

const errors = []
page.on('pageerror', (error) => errors.push(error.message))
page.on('response', (response) => {
  if (response.status() >= 500) errors.push(`${response.status()} ${response.url()}`)
})

async function waitForText(text) {
  await page.waitForFunction(
    (expected) => document.body.innerText.includes(expected),
    { timeout: 15_000 },
    text,
  )
}

async function clickText(text) {
  const clicked = await page.evaluate((expected) => {
    const element = [...document.querySelectorAll('button, a')]
      .find((candidate) => candidate.textContent?.toLocaleLowerCase('fr').includes(expected.toLocaleLowerCase('fr')))
    if (!(element instanceof HTMLElement)) return false
    element.click()
    return true
  }, text)
  if (!clicked) throw new Error(`Élément introuvable : ${text}`)
}

try {
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30_000 })
  await page.waitForSelector('.database-pill.connected', { timeout: 15_000 })
  await page.screenshot({ path: `${artifacts}/profuel_neon_dashboard.png`, fullPage: true })

  await clickText('Voir la mission active')
  await page.waitForSelector('.route-map.large', { timeout: 15_000 })
  await clickText('Simuler')
  const c1 = await page.waitForSelector('input[aria-label^="Mesure compartiment"]', { timeout: 15_000 })
  if (!c1) throw new Error('Champ de compartiment introuvable')
  await c1.focus()
  await page.keyboard.down('Control')
  await page.keyboard.press('A')
  await page.keyboard.up('Control')
  await c1.type('8500')
  await waitForText('-600 L')
  await clickText('Valider le dépotage')
  await page.waitForSelector('.success-hero', { timeout: 15_000 })
  await new Promise((resolve) => setTimeout(resolve, 2000))

  await page.reload({ waitUntil: 'networkidle0', timeout: 30_000 })
  await page.waitForSelector('.success-hero', { timeout: 15_000 })
  await page.screenshot({ path: `${artifacts}/profuel_neon_rapprochement.png`, fullPage: true })
  const persisted = true

  await page.select('.prototype-switch select', 'Pompiste')
  await page.waitForSelector('.shift-card', { timeout: 15_000 })
  await clickText('Saisir')
  await page.waitForSelector('.pump-grid', { timeout: 15_000 })

  const inputs = await page.$$('.pump-card input')
  if (inputs.length !== 2) throw new Error(`2 index attendus, ${inputs.length} trouvés`)
  await inputs[1].focus()
  await page.keyboard.down('Control')
  await page.keyboard.press('A')
  await page.keyboard.up('Control')
  await inputs[1].type('89350.2')
  const buttons = await page.$$('.pump-card button')
  await buttons[1].click()
  await page.waitForSelector('.pump-card.saved', { timeout: 15_000 })
  await new Promise((resolve) => setTimeout(resolve, 1000))
  await page.screenshot({ path: `${artifacts}/profuel_neon_index_pompe.png`, fullPage: true })

  console.log(JSON.stringify({
    ok: true,
    databaseBadge: 'Neon connecté',
    reconciliationGap: '-600 L',
    persistenceAfterReload: persisted,
    pumpReading: 'P02 = 89350.2 L',
    errors,
  }, null, 2))
} finally {
  await browser.close()
}
