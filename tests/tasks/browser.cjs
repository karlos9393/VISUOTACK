// Optional end-to-end suite. Uses a disposable authenticated account supplied by the caller.
// TASKS_PLAYWRIGHT_PATH=/path/to/playwright TASKS_TEST_STATE=/private/test-state.json node tests/tasks/browser.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { chromium } = require(process.env.TASKS_PLAYWRIGHT_PATH || 'playwright')
const base = process.env.TASKS_TEST_URL || 'http://localhost:3000'
const artifacts = process.env.TASKS_TEST_ARTIFACTS || '/tmp/visuo-task-browser'
const suffix = Date.now().toString().slice(-6)
const title = `Préparer le lancement de septembre ${suffix}`
const second = `Relire la proposition commerciale ${suffix}`
;(async () => {
  assert.ok(
    process.env.TASKS_TEST_STATE,
    'TASKS_TEST_STATE is required; use a disposable account.'
  )
  fs.mkdirSync(artifacts, { recursive: true })
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.TASKS_CHROME_PATH
      ? { executablePath: process.env.TASKS_CHROME_PATH }
      : {})
  })
  const context = await browser.newContext({
    storageState: process.env.TASKS_TEST_STATE,
    viewport: { width: 1440, height: 1000 },
    locale: 'fr-FR'
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  const button = (name) => page.getByRole('button', { name, exact: true })
  const idle = () =>
    page.waitForFunction(
      () => !document.querySelector('#task-quick-add')?.disabled
    )
  const view = async (name) => {
    await page
      .getByRole('navigation', { name: 'Vues des tâches' })
      .getByRole('button', { name: new RegExp(`^${name}`) })
      .click()
    await idle()
  }
  const add = async (text) => {
    await page
      .getByLabel('Titre de la nouvelle tâche', { exact: true })
      .fill(text)
    await page
      .getByLabel('Titre de la nouvelle tâche', { exact: true })
      .press('Enter')
    await button(text).waitFor()
    await idle()
  }
  try {
    await page.goto(`${base}/tasks`)
    await idle()
    assert.equal(
      await page.getByRole('heading', { name: 'Tâches', exact: true }).count(),
      1
    )
    const nav = await page
      .locator('aside')
      .first()
      .getByRole('link')
      .allTextContents()
    assert.deepEqual(nav.slice(0, 3), [
      'CRM Setting',
      'Tâches',
      'SUIVI SETTING'
    ])
    await button('Gérer les projets').click()
    await page.getByLabel('Nom', { exact: true }).fill(`Lancement ${suffix}`)
    await button('Créer').click()
    await page
      .getByRole('dialog')
      .getByText(`Lancement ${suffix}`, { exact: true })
      .waitFor()
    await page.getByText(`Lancement ${suffix}`, { exact: true }).locator('..').getByRole('button', { name: 'Modifier', exact: true }).click()
    await page
      .getByLabel('Nom', { exact: true })
      .fill(`Lancement produit ${suffix}`)
    await page.getByLabel('Couleur', { exact: true }).fill('#10b981')
    await button('Enregistrer').click()
    await page
      .getByRole('dialog')
      .getByText(`Lancement produit ${suffix}`, { exact: true })
      .waitFor()
    await button('Fermer').click()
    await button('Gérer les tags').click()
    await page.getByLabel('Nom', { exact: true }).fill(`à-valider-${suffix}`)
    await button('Créer').click()
    await page
      .getByRole('dialog')
      .getByText(`à-valider-${suffix}`, { exact: true })
      .waitFor()
    await button('Fermer').click()
    console.log('PASS projects and tags creation/rename')
    await add(title)
    await page.reload()
    await button(title).waitFor()
    await idle()
    console.log('PASS Enter creation and refresh persistence')
    await button(title).click()
    await page
      .getByLabel('Description', { exact: true })
      .fill(
        'Préparer les éléments, valider les visuels et publier la campagne.'
      )
    await page
      .getByLabel('Projet', { exact: true })
      .selectOption({ label: `Lancement produit ${suffix}` })
    await page.getByLabel('Priorité', { exact: true }).selectOption('3')
    await page.getByRole('checkbox', { name: new RegExp(`à-valider-${suffix}`) }).check()
    await page.getByLabel('Heure d’échéance', { exact: true }).fill('17:00')
    await page.getByLabel('Récurrence', { exact: true }).selectOption('daily')
    await page.getByLabel('Intervalle personnalisé', { exact: true }).fill('2')
    await page.getByRole('checkbox', { name: 'Important', exact: true }).check()
    await page
      .getByLabel('Nouvelle sous-tâche', { exact: true })
      .fill('Valider les visuels')
    await page.getByLabel('Nouvelle sous-tâche', { exact: true }).press('Enter')
    await page
      .getByRole('checkbox', {
        name: 'Terminer la sous-tâche : Valider les visuels',
        exact: true
      })
      .waitFor()
    await idle()
    await page
      .getByRole('checkbox', {
        name: 'Terminer la sous-tâche : Valider les visuels',
        exact: true
      })
      .check()
    await idle()
    await button('Enregistrer').click()
    await page.getByRole('dialog').waitFor({ state: 'hidden' })
    await idle()
    await page.reload()
    await button(title).waitFor()
    await idle()
    const card = page.locator('article').filter({ has: button(title) })
    assert.ok((await card.innerText()).includes('1 / 1'))
    assert.ok((await card.innerText()).includes('Haute'))
    await button(title).click()
    assert.equal(
      await page.getByLabel('Description', { exact: true }).inputValue(),
      'Préparer les éléments, valider les visuels et publier la campagne.'
    )
    assert.equal(
      await page
        .getByLabel('Intervalle personnalisé', { exact: true })
        .inputValue(),
      '2'
    )
    await page.screenshot({ path: path.join(artifacts, 'task-details.png') })
    await button('Fermer').click()
    console.log(
      'PASS details, tags, due time, recurrence and subtask persistence'
    )
    await page
      .getByRole('checkbox', { name: `Terminer : ${title}`, exact: true })
      .click()
    await idle()
    await view('À venir')
    await button(title).waitFor()
    assert.ok(
      (
        await page
          .locator('article')
          .filter({ has: button(title) })
          .innerText()
      ).includes('0 / 1')
    )
    await view('Terminées')
    await button(title).waitFor()
    console.log('PASS recurring next occurrence and completed history')
    await view('Aujourd’hui')
    await add(second)
    await page
      .getByLabel('Rechercher les tâches', { exact: true })
      .fill('zz-no-match')
    assert.equal(await page.locator('article').count(), 0)
    await page.getByLabel('Rechercher les tâches', { exact: true }).fill('')
    await button(second).waitFor()
    await view('Toutes les tâches')
    await button('Kanban').click()
    await page
      .locator('article')
      .filter({ has: button(second) })
      .dragTo(page.getByRole('region', { name: 'En cours', exact: true }))
    await idle()
    await page
      .getByRole('region', { name: 'En cours', exact: true })
      .getByRole('button', { name: second, exact: true })
      .waitFor()
    await page.reload()
    await idle()
    await view('Toutes les tâches')
    await button('Kanban').click()
    await page
      .getByRole('region', { name: 'En cours', exact: true })
      .getByRole('button', { name: second, exact: true })
      .waitFor()
    await page.screenshot({
      path: path.join(artifacts, 'tasks-kanban.png'),
      fullPage: true
    })
    await button('Matrice').click()
    await page
      .locator('article')
      .filter({ has: button(second) })
      .dragTo(
        page.getByRole('region', { name: 'Urgent + Important', exact: true })
      )
    await idle()
    await page
      .getByRole('region', { name: 'Urgent + Important', exact: true })
      .getByRole('button', { name: second, exact: true })
      .waitFor()
    await button(second).click()
    assert.equal(
      await page
        .getByRole('checkbox', { name: 'Urgent', exact: true })
        .isChecked(),
      true
    )
    assert.equal(
      await page
        .getByRole('checkbox', { name: 'Important', exact: true })
        .isChecked(),
      true
    )
    await button('Fermer').click()
    await page.screenshot({
      path: path.join(artifacts, 'tasks-matrix.png'),
      fullPage: true
    })
    console.log('PASS search, Kanban drag persistence and matrix drag')
    await button('Liste').click()
    await button(second).click()
    await button('Supprimer').click()
    await page
      .getByRole('dialog', { name: 'Supprimer la tâche ?' })
      .getByRole('button', { name: 'Supprimer', exact: true })
      .click()
    await idle()
    await view('Corbeille')
    await button(second).waitFor()
    await button(second).click()
    await button('Restaurer la tâche').click()
    await page.getByRole('dialog').waitFor({ state: 'hidden' })
    await idle()
    await view('Toutes les tâches')
    await button(second).waitFor()
    console.log('PASS soft delete and restore')
    for (const [width, height, name] of [
      [1440, 1000, 'desktop'],
      [1024, 768, 'ipad'],
      [390, 844, 'mobile']
    ]) {
      await page.setViewportSize({ width, height })
      await page.evaluate(() => window.scrollTo(0, 0))
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        ),
        `Horizontal overflow at ${width}`
      )
      await page.screenshot({
        path: path.join(artifacts, `tasks-${name}.png`),
        fullPage: true
      })
      await button(second).click()
      assert.ok(await page.getByRole('dialog').isVisible())
      const drawerRect = await page.getByRole('dialog').boundingBox()
      assert.equal(drawerRect.y, 0)
      assert.equal(drawerRect.height, height)
      assert.ok(
        await page
          .getByRole('dialog')
          .evaluate(
            (el) => el.getBoundingClientRect().width <= window.innerWidth
          )
      )
      await page.screenshot({
        path: path.join(artifacts, `details-${name}.png`)
      })
      await page.keyboard.press('Escape')
      await page.getByRole('dialog').waitFor({ state: 'hidden' })
    }
    assert.equal(errors.length, 0, errors.join('\n'))
    console.log(
      'PASS desktop / iPad / mobile, drawer keyboard, zero console errors'
    )
    await page.setViewportSize({ width: 1440, height: 1000 })
    for (const route of [
      '/crm-tracker/setting',
      '/crm-tracker',
      '/contenu/calendrier',
      '/contenu/generateur',
      '/contenu/performance',
      '/contenu/performance/comparer',
      '/admin'
    ]) {
      const response = await page.goto(base + route)
      assert.equal(response.status(), 200, route)
      assert.equal(
        await page
          .getByText('Une erreur est survenue', { exact: true })
          .count(),
        0,
        route
      )
      console.log('PASS route', route)
    }
    const anonymous = await browser.newContext()
    const login = await anonymous.newPage()
    await login.goto(base + '/tasks')
    assert.ok(login.url().endsWith('/login'))
    console.log('PASS anonymous task access redirects to existing login')
    console.log('ALL BROWSER CHECKS PASSED')
  } catch (error) {
    await page
      .screenshot({ path: path.join(artifacts, 'failure.png'), fullPage: true })
      .catch(() => {})
    console.error('BROWSER ERRORS', errors)
    throw error
  } finally {
    await browser.close()
  }
})().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
