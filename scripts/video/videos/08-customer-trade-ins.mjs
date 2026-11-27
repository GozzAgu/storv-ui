/**
 * Video 8 · Customer trade-ins (storyboard in the "Storvv video series" doc).
 * Each step: `say` is the narration; `run` is what happens on screen while it plays.
 */
export default {
  id: '08-customer-trade-ins',
  title: 'Customer trade-ins',

  /** Not recorded: a fresh demo, on the Overview page. */
  async setup({ page }, base) {
    await page.goto(`${base}/demo`, { waitUntil: 'networkidle' })
    await page.goto(`${base}/demo/dashboard`, { waitUntil: 'networkidle' })
    await nav(page, 'Customer trade-ins').waitFor({ timeout: 60_000 })
  },

  steps: [
    {
      say: "In this video, you'll record an item you've bought back from a customer.",
      run: async ({ page, click }) => click(nav(page, 'Customer trade-ins')),
    },
    {
      say: "Click Record trade-in. Note, this isn't a sale. You pay the customer, and the item goes straight into your stock.",
      run: async ({ page, click, hover, wait }) => {
        await click(page.getByRole('button', { name: 'Record trade-in' }).first())
        await wait(1200)
        await hover(form(page).getByText('Not a sale:'))
      },
    },
    {
      say: "Step one: who's selling it. Type their name. Add a phone number if you may need to reach them later.",
      run: async ({ page, type }) => {
        await type(form(page).getByRole('textbox', { name: 'Customer name' }), 'Emeka Obi')
        await type(form(page).getByRole('textbox', { name: /^Phone/ }), '0803 123 4567')
      },
    },
    {
      say: 'Step two: describe the item. Pick its category, and the details that category needs appear below.',
      run: async ({ page, click, wait }) => {
        const category = form(page).getByRole('combobox', { name: 'Inventory category' })
        await click(category)
        await category.selectOption({ label: 'Smartphones · Phones' })
        await wait(700)
      },
    },
    {
      say: "Here, that's the product name, the price you'll sell it for, and how many you're taking in.",
      run: async ({ page, type }) => {
        const product = form(page).getByRole('textbox', { name: 'Product' })
        await product.fill('')
        await type(product, 'iPhone 12 64GB')
        await type(form(page).getByRole('spinbutton', { name: 'Price' }), '280000')
        await type(form(page).getByRole('spinbutton', { name: 'Quantity in stock' }), '1')
      },
    },
    {
      say: 'Step three: what you paid the customer, and how you paid them.',
      run: async ({ page, type, click }) => {
        await type(
          form(page).getByRole('spinbutton', { name: 'Amount paid to customer' }),
          '200000'
        )
        const method = form(page).getByRole('combobox', { name: 'Payment method' })
        await click(method)
        await method.selectOption('Transfer')
      },
    },
    {
      say: 'The summary at the bottom shows the payment, and where the item goes.',
      run: async ({ page, hover }) =>
        hover(
          form(page)
            .getByRole('contentinfo')
            .getByText(/item goes into stock/)
        ),
    },
    {
      say: 'Click Record trade-in. The trade-in is on your list, and the phone is now in stock, at what you paid.',
      run: async ({ page, click, hover, wait }) => {
        await click(form(page).getByRole('button', { name: 'Record trade-in' }))
        await wait(900)
        await hover(page.getByRole('cell', { name: /iPhone 12 64GB/ }).first())
      },
    },
    {
      say: "If the customer is swapping their phone towards something they're buying now, don't use this page. Start a New sale, and tick the swap option at checkout instead.",
      lead: 0,
      run: async ({ page, click, hover }) => {
        await dismissToasts(page)
        // Straight to checkout: the narration is about the swap step only.
        await click(nav(page, 'Sales'))
        await click(page.getByRole('button', { name: 'New sale' }).first())
        const sale = page.getByRole('dialog', { name: 'New sale' })
        await sale.getByRole('button', { name: /Accessories/ }).click()
        await sale.getByRole('button', { name: 'Next' }).click()
        await sale.getByText('20W USB-C charger', { exact: true }).click()
        await sale.getByRole('button', { name: 'Next' }).click()
        await hover(sale.getByRole('heading', { name: /Taking a device in swap\?/ }))
        await click(sale.getByText('This is a swap-in transaction', { exact: true }))
      },
    },
    {
      say: "That's trade-ins: who sold it, what it is, and what you paid. Next, returns and write-offs.",
      run: async ({ page, click, wait }) => {
        await click(
          page.getByRole('dialog', { name: 'New sale' }).getByRole('button', { name: 'Cancel' })
        )
        await wait(300)
        await click(nav(page, 'Customer trade-ins'))
      },
    },
  ],
}

/** A link in the side menu. */
function nav(page, name) {
  return page.getByRole('navigation', { name: 'Sections' }).getByRole('link', { name, exact: true })
}

/** The Record a trade-in drawer. */
function form(page) {
  return page.getByRole('dialog', { name: 'Record a trade-in' })
}

/** Close the success toast so it doesn't sit over the next screens. */
async function dismissToasts(page) {
  for (const close of await page.getByRole('button', { name: 'Dismiss' }).all()) {
    await close.click().catch(() => {})
  }
}
