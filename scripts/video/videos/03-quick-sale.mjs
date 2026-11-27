/**
 * Video 3 · Sell fast with Quick sale (storyboard in the "Storvv video series" doc).
 * Each step: `say` is the narration; `run` is what happens on screen while it plays.
 */
export default {
  id: '03-quick-sale',
  title: 'Sell fast with Quick sale',

  /** Not recorded: a fresh demo, already on the Sales page. */
  async setup({ page }, base) {
    await page.goto(`${base}/demo`, { waitUntil: 'networkidle' })
    await page.goto(`${base}/demo/dashboard/receipts`, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Quick sale' }).first().waitFor({ timeout: 60_000 })
  },

  steps: [
    {
      say: "In this video, you'll make a sale in a few seconds with Quick sale.",
      run: async ({ page, hover }) => hover(page.getByRole('heading', { level: 1 }).first()),
    },
    {
      say: 'When the queue is long, click Quick sale.',
      run: async ({ page, click }) =>
        click(page.getByRole('button', { name: 'Quick sale' }).first()),
    },
    {
      say: 'First, pick the category the product is in. Here, Accessories.',
      run: async ({ page, click }) =>
        click(
          quick(page)
            .getByRole('button', { name: /Accessories/ })
            .first()
        ),
    },
    {
      say: 'You can scan a barcode with your phone camera, or search by name, SKU or serial number. Or just tap the product to add it.',
      run: async ({ page, hover, click, wait }) => {
        await hover(quick(page).getByRole('textbox', { name: 'Barcode, SKU, or serial' }))
        await wait(1800)
        await click(
          quick(page)
            .getByRole('button', { name: /20W USB-C charger/ })
            .first()
        )
      },
    },
    {
      say: 'Change the quantity with plus and minus.',
      run: async ({ page, click }) =>
        click(quick(page).getByRole('button', { name: 'Increase quantity' }).first()),
    },
    {
      say: 'You can also change the price or add a discount. Storvv asks for a reason, so the owner can see why.',
      run: async ({ page, hover }) =>
        hover(
          quick(page)
            .getByRole('button', { name: /Add discount/ })
            .first()
        ),
    },
    {
      say: 'Adding the customer is optional. Leave it empty, and the sale is recorded as a walk-in.',
      run: async ({ page, hover }) =>
        hover(
          quick(page)
            .getByRole('button', { name: /Customer info/ })
            .first()
        ),
    },
    {
      say: 'Choose how they paid.',
      run: async ({ page, click }) => click(quick(page).locator('.s-qs-tender').first()),
    },
    {
      say: 'If they pay part in cash and part by transfer, turn on Split payment, and add a line for each.',
      run: async ({ page, click, wait }) => {
        const split = quick(page).getByText('Split payment', { exact: true }).first()
        await click(split)
        await wait(2200)
        await click(split)
      },
    },
    {
      say: 'The button shows the total. Click Complete sale.',
      run: async ({ page, click }) =>
        click(page.getByRole('button', { name: /Complete sale/ }).first()),
    },
    {
      say: 'Done. The sale is saved at the top of your Sales list, and the stock goes down straight away. Open it any time to print the receipt, save it as a PDF, or email it.',
      run: async ({ page, hover, wait }) => {
        await wait(900)
        await hover(page.getByRole('cell', { name: /#REC-/ }).first())
      },
    },
    {
      say: "That's Quick sale: add, pay, done. Next, a full sale with a customer, a discount and a swap.",
    },
  ],
}

/** The Quick sale drawer. */
function quick(page) {
  return page.getByRole('dialog', { name: 'Quick sale' })
}
