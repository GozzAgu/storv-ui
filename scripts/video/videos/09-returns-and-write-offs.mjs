/**
 * Video 9 · Returns and write-offs (storyboard in the "Storvv video series" doc).
 * Each step: `say` is the narration; `run` is what happens on screen while it plays.
 */
export default {
  id: '09-returns-and-write-offs',
  title: 'Returns and write-offs',

  /**
   * Not recorded: a fresh demo where Ada has just returned her iPhone and it was held for checking
   * (video 5 does this on camera), then the Overview page.
   */
  async setup({ page }, base) {
    await page.goto(`${base}/demo`, { waitUntil: 'networkidle' })
    await page.goto(`${base}/demo/dashboard/receipts`, { waitUntil: 'networkidle' })
    const sale = page.getByRole('row', { name: /#DEMO-1001/ })
    await sale.getByRole('button', { name: 'Sale actions' }).click({ timeout: 60_000 })
    await page.getByRole('menuitem', { name: 'Refund' }).click()
    const refund = page.getByRole('alertdialog', { name: 'Return / refund sale' })
    await refund.getByText('Needs checking, hold it off sale').click()
    await refund
      .getByRole('textbox', { name: 'What did the customer say is wrong?' })
      .fill('Screen flickers')
    await refund.getByText(/I confirm this return/).click()
    await refund.getByRole('button', { name: 'Confirm return / refund' }).click()
    await refund.waitFor({ state: 'hidden' })
    // Move on inside the app: a full page load here could lose the return before the demo saves it
    await nav(page, 'Overview').click()
    await page.waitForURL(/\/demo\/dashboard\/?$/)
    await dismissToasts(page)
  },

  steps: [
    {
      say: "In this video, you'll deal with anything that comes back, or leaves your stock without a sale.",
      run: async ({ page, click }) => click(nav(page, 'Returns & write-offs')),
    },
    {
      say: "The Returns tab starts with a summary: what's ready to send, what's with suppliers, and what went back in stock.",
      run: async ({ page, hover, wait }) => {
        await hover(page.getByText('Ready to send', { exact: true }).first())
        await wait(1200)
        await hover(page.getByText('With suppliers', { exact: true }).first())
        await wait(1200)
        await hover(page.getByText('Back in stock', { exact: true }).first())
      },
    },
    {
      say: 'Below it, To inspect lists items customers brought back and held off sale. Here is the iPhone Ada returned, with what she said was wrong.',
      run: async ({ page, hover, wait }) => {
        await hover(inspect(page).getByRole('heading', { name: /To inspect/ }))
        await wait(1500)
        await hover(inspect(page).getByRole('cell', { name: /Screen flickers/ }))
      },
    },
    {
      say: "If it's fine after checking, click Back on sale, and it's ready to sell again.",
      run: async ({ page, hover }) =>
        hover(inspect(page).getByRole('button', { name: 'Back on sale' })),
    },
    {
      say: "If it's faulty, send it back to the supplier. Click Return to supplier.",
      run: async ({ page, click }) =>
        click(inspect(page).getByRole('button', { name: 'Return to supplier' })),
    },
    {
      say: 'Step one shows the item the customer brought back. It is already chosen.',
      run: async ({ page, hover }) =>
        hover(toSupplier(page).getByRole('heading', { name: 'Check the returned item' })),
    },
    {
      say: "Step two: who you're sending it back to, and their invoice or waybill number if you have one.",
      run: async ({ page, type }) => {
        await type(toSupplier(page).getByRole('combobox', { name: 'Supplier' }), 'Slot Ikeja')
        await type(
          toSupplier(page).getByRole('textbox', { name: /Supplier reference/ }),
          'INV-20431'
        )
      },
    },
    {
      say: 'Step three: the fault. Storvv copies what the customer said. Add more detail, so the supplier knows what to fix.',
      run: async ({ page, click }) => {
        const fault = toSupplier(page).getByRole('textbox', { name: 'What is wrong with it?' })
        await click(fault)
        await page.keyboard.press('End')
        await fault.pressSequentially(' after ten minutes of use', { delay: 75 })
      },
    },
    {
      say: "The summary shows what's going back, and to whom. Click Return to supplier.",
      run: async ({ page, hover, click, wait }) => {
        await hover(
          toSupplier(page)
            .getByRole('contentinfo')
            .getByText(/back to Slot Ikeja/)
        )
        await wait(1500)
        await click(toSupplier(page).getByRole('button', { name: 'Return to supplier' }))
      },
    },
    {
      say: 'It now waits as Ready to send. When it leaves the shop, click Send to supplier, then Mark as sent.',
      run: async ({ page, hover, click, wait }) => {
        await dismissToasts(page)
        await hover(iphoneReturn(page).getByRole('cell', { name: 'Ready to send' }))
        await wait(800)
        await click(iphoneReturn(page).getByRole('button', { name: 'Send to supplier' }))
        await wait(800)
        await click(
          page
            .getByRole('dialog', { name: 'Send to supplier' })
            .getByRole('button', { name: 'Mark as sent' })
        )
      },
    },
    {
      say: 'When the supplier replies, click Resolve, and choose what they did: refunded, replaced, a credit note, repaired, or rejected the claim.',
      run: async ({ page, click, wait }) => {
        await dismissToasts(page)
        await click(iphoneReturn(page).getByRole('button', { name: 'Resolve' }))
        await wait(800)
        await click(closeReturn(page).getByRole('combobox', { name: 'What did the supplier do?' }))
      },
    },
    {
      say: 'If it was repaired or replaced, the item goes back in stock. We will cancel for now.',
      run: async ({ page, hover, click, wait }) => {
        await closeReturn(page)
          .getByRole('combobox', { name: 'What did the supplier do?' })
          .selectOption('Replaced')
        await hover(
          closeReturn(page)
            .getByRole('contentinfo')
            .getByText(/goes back in stock/)
        )
        await wait(1500)
        await click(closeReturn(page).getByRole('button', { name: 'Cancel' }))
      },
    },
    {
      say: "Lost or damaged stock is a write-off. In Inventory, open the category, then the product's menu, and choose Write off as a loss.",
      run: async ({ page, click }) => {
        await click(nav(page, 'Inventory'))
        await click(page.getByRole('button', { name: 'Accessories', exact: true }))
        await click(
          page
            .getByRole('row', { name: /Silicone phone case/ })
            .getByRole('button', { name: 'Product actions' })
        )
        await click(page.getByRole('menuitem', { name: 'Write off as a loss' }))
      },
    },
    {
      say: 'Enter how many units, and pick the reason.',
      run: async ({ page, type, click }) => {
        const units = writeOff(page).getByRole('spinbutton', { name: 'Units to write off' })
        await units.fill('')
        await type(units, '2')
        const why = writeOff(page).getByRole('combobox', { name: 'Why?' })
        await click(why)
        await why.selectOption('Lost or stolen')
      },
    },
    {
      say: 'Then say what happened. Lost or stolen stock needs a short note.',
      run: async ({ page, type }) =>
        type(
          writeOff(page).getByRole('textbox', { name: 'What happened' }),
          'Two missing after stock count'
        ),
    },
    {
      say: 'Before you confirm, Storvv shows the loss, at cost. Click Write off 2 units.',
      run: async ({ page, hover, click, wait }) => {
        await hover(
          writeOff(page)
            .getByRole('contentinfo')
            .getByText(/recorded as a loss at cost/)
        )
        await wait(1800)
        await click(writeOff(page).getByRole('button', { name: 'Write off 2 units' }))
      },
    },
    {
      say: 'Back on Returns and write-offs, open the Stock out log. It lists everything that left stock without a sale: what, why, who, and when.',
      run: async ({ page, click, hover }) => {
        await dismissToasts(page)
        await click(nav(page, 'Returns & write-offs'))
        await click(page.getByRole('tab', { name: 'Stock out log' }))
        await hover(page.getByRole('button', { name: 'Why Silicone phone case is out of stock' }))
      },
    },
    {
      say: 'To find something, search by item, serial number, reason or person.',
      run: async ({ page, type }) =>
        type(
          page.getByRole('searchbox', { name: 'Search by item, serial number, reason or person' }),
          'phone case'
        ),
    },
    {
      say: "That's it: check what comes back, send faulty stock to the supplier, write off losses, and see it all in the log. Next, sales leads.",
    },
  ],
}

/** A link in the side menu. */
function nav(page, name) {
  return page.getByRole('navigation', { name: 'Sections' }).getByRole('link', { name, exact: true })
}

/** The To inspect list of held customer returns. */
function inspect(page) {
  return page.getByRole('region', { name: /To inspect/ })
}

/** The iPhone's row in Supplier returns. */
function iphoneReturn(page) {
  return page
    .getByRole('region', { name: 'Supplier returns' })
    .getByRole('row', { name: /iPhone 13 128GB/ })
}

function toSupplier(page) {
  return page.getByRole('dialog', { name: 'Return to supplier' })
}

function closeReturn(page) {
  return page.getByRole('dialog', { name: 'Close return' })
}

function writeOff(page) {
  return page.getByRole('dialog', { name: 'Write off as a loss' })
}

/** Close success toasts so they don't sit over the next screens. */
async function dismissToasts(page) {
  for (const close of await page.getByRole('button', { name: 'Dismiss' }).all()) {
    await close.click().catch(() => {})
  }
}
