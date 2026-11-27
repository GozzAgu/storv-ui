/**
 * Video 14 · Lend stock to resellers (storyboard in the "Storvv video series" doc).
 * Each step: `say` is the narration; `run` is what happens on screen while it plays.
 *
 * Demo workaround: the demo can't make a serial-numbered category yet (demo-bridge always maps
 * folders to `hasSerialNumbers: false`), and only those can be lent. Setup creates Laptops with
 * three laptops, then keeps that one category flagged as serial-numbered in the page's inventory
 * store, so the lend form behaves as it does in a real store.
 */
export default {
  id: '14-lend-stock-to-resellers',
  title: 'Lend stock to resellers',

  /** Not recorded: Laptops with three units in Lagos, then the Overview. */
  async setup({ page }, base) {
    await page.context().addInitScript(keepLaptopsSerialNumbered)
    await page.goto(`${base}/demo`, { waitUntil: 'networkidle' })
    await page.goto(`${base}/demo/dashboard/inventory`, { waitUntil: 'networkidle' })

    await page.getByRole('button', { name: 'New category' }).first().click()
    const cat = page.getByRole('dialog', { name: 'Create new category' })
    await cat.getByRole('textbox', { name: 'Category name' }).fill('Laptops')
    await cat.getByRole('radio', { name: 'Computers & laptops' }).check({ force: true })
    await cat.getByRole('checkbox', { name: /Use serial numbers/ }).check({ force: true })
    await cat.getByRole('button', { name: 'Create category' }).click()
    const noProfit = page.getByRole('button', { name: 'Continue without profit' })
    await noProfit.click({ timeout: 5000 }).catch(() => {})
    await page.getByRole('button', { name: 'Laptops', exact: true }).click()

    for (const [name, price] of LAPTOPS) {
      await page.getByRole('button', { name: 'Add product' }).first().click()
      const add = page.getByRole('dialog', { name: 'Add product' })
      await add.getByRole('textbox', { name: 'Product name' }).fill(name)
      await add.getByRole('spinbutton', { name: 'Price' }).fill(price)
      await add.getByRole('spinbutton', { name: 'Quantity in stock' }).fill('1')
      await add.getByRole('button', { name: 'Add product' }).click()
      await page.getByRole('cell', { name, exact: true }).waitFor()
    }

    await page.getByRole('link', { name: 'Overview' }).click()
    await page.waitForLoadState('networkidle')
  },

  steps: [
    {
      say: "In this video, you'll lend laptops to a reseller, and track them until they're sold or returned.",
      run: async ({ page, click }) => click(page.getByRole('link', { name: 'Stock lent out' })),
    },
    {
      say: "Loans move through these tabs as they're approved, sold or returned.",
      run: async ({ page, hover, wait }) => {
        const tabs = page.getByRole('tablist', { name: 'Loan status' }).getByRole('tab')
        for (let i = 0; i < 5; i++) {
          await hover(tabs.nth(i))
          await wait(350)
        }
      },
    },
    {
      say: "Click Lend stock. A loan isn't a sale. The laptops are set aside until the reseller sells them, or brings them back.",
      run: async ({ page, click, hover, wait }) => {
        await click(page.getByRole('button', { name: 'Lend stock' }).first())
        await wait(600)
        await hover(lend(page).getByText('Not a sale:').first())
      },
    },
    {
      say: 'Step one: pick the items. Open a category, and its subcategory if it has one. Only units that are free to lend are listed.',
      run: async ({ page, click, hover, wait }) => {
        await click(
          lend(page)
            .getByRole('group', { name: 'Category' })
            .getByRole('button', { name: /Laptops/ })
        )
        await wait(900)
        await hover(lend(page).getByText('Units free to lend in').first())
      },
    },
    {
      say: 'Tick the units going out.',
      run: async ({ page, click }) => {
        await click(lend(page).getByRole('checkbox', { name: LAPTOPS[0][0] }))
        await click(lend(page).getByRole('checkbox', { name: LAPTOPS[1][0] }))
      },
    },
    {
      say: "Step two: who's borrowing them. A phone number helps you follow up.",
      run: async ({ page, type }) => {
        await type(lend(page).getByRole('textbox', { name: 'Borrower name' }), 'Emeka Gadgets')
        await type(lend(page).getByRole('textbox', { name: /^Phone/ }), '0803 555 0142')
      },
    },
    {
      say: "Step three, optional: a note, like when they'll be back.",
      run: async ({ page, type }) =>
        type(lend(page).getByRole('textbox', { name: /^Notes/ }), 'Back by Friday'),
    },
    {
      say: 'Check the summary, and click Confirm stock loan.',
      run: async ({ page, hover, click, wait }) => {
        await hover(lend(page).getByRole('contentinfo').getByText('Emeka Gadgets').first())
        await wait(1200)
        await click(lend(page).getByRole('button', { name: 'Confirm stock loan' }))
      },
    },
    {
      say: "As the owner, your loan starts straight away, so it's On loan. Staff who aren't admins send theirs for approval instead, and an admin like Chioma approves it before the goods go out.",
      run: async ({ page, hover, wait }) => {
        await wait(600)
        await hover(loanRow(page).getByRole('cell').nth(5))
        await wait(2500)
        await hover(page.getByRole('tab', { name: /Awaiting approval/ }))
      },
    },
    {
      say: 'Click the units number to see exactly which laptops went out.',
      run: async ({ page, click }) =>
        click(page.getByRole('button', { name: 'Show the 2 units lent to Emeka Gadgets' })),
    },
    {
      say: "When the reseller sells a unit, choose Mark sold by borrower. If they bring it back, choose Return to stock, and it's back on sale.",
      run: async ({ page, click, hover, wait }) => {
        await click(page.getByRole('button', { name: 'Actions for loan to Emeka Gadgets' }))
        await hover(page.getByRole('menuitem', { name: 'Mark sold by borrower' }))
        await wait(2200)
        await hover(page.getByRole('menuitem', { name: 'Return to stock' }))
      },
    },
    {
      say: 'Recap: pick the units, name the borrower, confirm. Next: your settings and security.',
      run: async ({ page }) => page.keyboard.press('Escape'),
    },
  ],
}

/** Name and price of each laptop setup adds; one unit each. */
const LAPTOPS = [
  ['HP EliteBook 840 G8', '450000'],
  ['Dell Latitude 5420', '420000'],
  ['Lenovo ThinkPad T14', '480000'],
]

/** The lend drawer. */
function lend(page) {
  return page.getByRole('dialog', { name: 'Lend stock to a reseller' })
}

/** The loan this video creates. */
function loanRow(page) {
  return page.getByRole('row', { name: /Emeka Gadgets/ }).first()
}

/** Runs in the page: flags the demo's Laptops category as serial-numbered, and keeps it so. */
function keepLaptopsSerialNumbered() {
  setInterval(() => {
    const app = document.querySelector('#__nuxt')?.__vue_app__
    const inventory = app?.config.globalProperties.$pinia?._s.get('inventory')
    for (const folder of inventory?.folders ?? []) {
      if (folder.name === 'Laptops' && !folder.hasSerialNumbers) folder.hasSerialNumbers = true
    }
  }, 50)
}
