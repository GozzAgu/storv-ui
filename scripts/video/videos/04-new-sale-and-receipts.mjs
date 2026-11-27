/**
 * Video 4 · New sale and receipts (storyboard in the "Storvv video series" doc).
 * Sells a Samsung A54 from the demo's Phones › Smartphones stock to Ada Okonkwo, with a discount.
 * Each step: `say` is the narration; `run` is what happens on screen while it plays.
 */
export default {
  id: '04-new-sale-and-receipts',
  title: 'New sale and receipts',

  /** Not recorded: a fresh demo, already on the Sales page. */
  async setup({ page }, base) {
    await page.goto(`${base}/demo`, { waitUntil: 'networkidle' })
    await page.goto(`${base}/demo/dashboard/receipts`, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'New sale' }).first().waitFor({ timeout: 60_000 })
  },

  steps: [
    {
      say: "In this video, you'll make a full sale, with a customer, a discount and a receipt.",
      run: async ({ page, hover }) => hover(page.getByRole('heading', { level: 1 }).first()),
    },
    {
      say: 'Click New sale. The bar at the top shows the four stages: category, subcategory, products, then checkout.',
      run: async ({ page, click, hover, wait }) => {
        await click(page.getByRole('button', { name: 'New sale' }).first())
        await wait(1200)
        await hover(sale(page).getByRole('navigation', { name: 'Sale progress' }))
      },
    },
    {
      say: "Pick the category, here Phones. The hint at the bottom says what's next. Click Next.",
      run: async ({ page, click, hover, wait }) => {
        await click(sale(page).getByRole('button', { name: /^Phones/ }))
        await hover(footerText(page))
        await wait(1800)
        await click(sale(page).getByRole('button', { name: 'Next' }))
      },
    },
    {
      say: 'Now the subcategory: Smartphones. Then Next again.',
      run: async ({ page, click, wait }) => {
        await click(sale(page).getByRole('button', { name: /^Smartphones/ }))
        await wait(700)
        await click(sale(page).getByRole('button', { name: 'Next' }))
      },
    },
    {
      say: 'Tick the phone being sold, here the Samsung A54. The running total appears at the bottom.',
      run: async ({ page, click, hover }) => {
        await click(sale(page).getByText('Samsung A54', { exact: true }))
        await hover(footerText(page))
      },
    },
    {
      say: 'Giving a discount? Click Discount and enter the amount.',
      run: async ({ page, click, type }) => {
        await click(sale(page).getByRole('button', { name: 'Discount' }))
        await type(sale(page).getByRole('spinbutton', { name: 'Discount' }), '5000')
      },
    },
    {
      say: 'Click Next to go to checkout.',
      run: async ({ page, click }) => click(sale(page).getByRole('button', { name: 'Next' })),
    },
    {
      say: "Step one: who's buying. Start typing to pick a saved customer, or leave it blank for a walk-in.",
      run: async ({ page, type, click }) => {
        await type(sale(page).getByRole('textbox', { name: 'Customer name' }), 'Ada')
        await click(sale(page).getByRole('option', { name: /Ada Okonkwo/ }))
      },
    },
    {
      say: "Step two: take payment. Choose how they're paying: cash, transfer or card.",
      run: async ({ page, hover }) => {
        const method = sale(page).getByRole('combobox', { name: 'Payment method' })
        await hover(method)
        await method.selectOption('Transfer')
      },
    },
    {
      say: 'Paying two ways? Tick Split payment, and enter each amount. They must add up to the total.',
      run: async ({ page, click, hover, wait }) => {
        const split = sale(page).getByText('Split payment', { exact: true })
        await click(split)
        await wait(600)
        await hover(sale(page).getByRole('status'))
        await wait(1500)
        await click(split)
      },
    },
    {
      say: "Paying part now and the rest later? Choose Balance due, and enter the deposit collected today. The sale then waits under Outstanding. Here, they're paying in full.",
      run: async ({ page, click, type, wait }) => {
        await click(sale(page).getByRole('radio', { name: 'Balance due' }))
        await type(
          sale(page).getByRole('spinbutton', { name: 'Deposit collected today' }),
          '100000'
        )
        await wait(2600)
        await click(sale(page).getByRole('radio', { name: 'Paid in full' }))
      },
    },
    {
      say: 'Because there is a discount, step three asks why. The owner sees this reason later.',
      run: async ({ page, type }) =>
        type(sale(page).getByRole('textbox', { name: 'Discount reason' }), 'Loyal customer'),
    },
    {
      say: 'Step four is for swaps. If the customer is trading in a device, tick this box. Then fill in its details. Its value comes off what they pay.',
      run: async ({ page, click, wait }) => {
        const swap = sale(page).getByText('This is a swap-in transaction', { exact: true })
        await click(swap)
        await wait(3000)
        await click(swap)
      },
    },
    {
      say: 'Before you finish, check the summary. Item, total, payment, customer.',
      run: async ({ page, hover }) => hover(footerText(page)),
    },
    {
      say: 'The button shows the total. Click Create sale.',
      run: async ({ page, click }) =>
        click(sale(page).getByRole('button', { name: /Create sale/ })),
    },
    {
      say: 'Every sale lands at the top of your Sales list. Click it to open it.',
      run: async ({ page, hover, click, wait }) => {
        await wait(600)
        const row = page.getByRole('row', { name: /REC-.*Ada Okonkwo/ }).first()
        await hover(row.getByRole('cell', { name: 'Samsung A54' }))
        await wait(1200)
        await click(row.getByRole('cell', { name: 'Samsung A54' }))
      },
    },
    {
      say: 'Click Preview receipt to see what your customer gets. You can email it. Or click Print / PDF. Print it, or save a PDF.',
      run: async ({ page, click, hover, wait }) => {
        await click(page.getByRole('button', { name: 'Preview receipt' }))
        await wait(2400)
        const receipt = page.getByRole('dialog', { name: /^Receipt/ })
        await hover(receipt.getByRole('button', { name: 'Email' }))
        await wait(900)
        await hover(receipt.getByRole('button', { name: 'Print / PDF' }))
      },
    },
    {
      say: 'Recap: pick the product, add the customer, take payment, then send the receipt. Next: what to do when a sale needs fixing.',
      run: async ({ page, click }) =>
        click(
          page.getByRole('dialog', { name: /^Receipt/ }).getByRole('button', { name: 'Close' })
        ),
    },
  ],
}

/** The New sale drawer. */
function sale(page) {
  return page.getByRole('dialog', { name: 'New sale' })
}

/** The hint line above the drawer's buttons. */
function footerText(page) {
  return sale(page).getByRole('contentinfo').getByRole('paragraph').first()
}
