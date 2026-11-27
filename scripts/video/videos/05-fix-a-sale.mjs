/**
 * Video 5 · Fix a sale: edits, refunds and balances due (storyboard in the "Storvv video series" doc).
 * Edits Ada's Samsung A54 sale (made off camera, as in video 4), refunds this morning's walk-in
 * sale DEMO-1002, and opens Record payment on the demo's balance-due sale DEMO-1003.
 * Each step: `say` is the narration; `run` is what happens on screen while it plays.
 */
export default {
  id: '05-fix-a-sale',
  title: 'Fix a sale: edits, refunds and balances due',

  /** Not recorded: a fresh demo plus the sale from video 4, on the Sales page. */
  async setup({ page }, base) {
    await page.goto(`${base}/demo`, { waitUntil: 'networkidle' })
    await page.goto(`${base}/demo/dashboard/receipts`, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'New sale' }).first().waitFor({ timeout: 60_000 })

    // The sale from video 4: a Samsung A54 for Ada, ₦5,000 off, paid by transfer
    await page.getByRole('button', { name: 'New sale' }).first().click()
    const d = page.getByRole('dialog', { name: 'New sale' })
    await d.getByRole('button', { name: /^Phones/ }).click()
    await d.getByRole('button', { name: 'Next' }).click()
    await d.getByRole('button', { name: /^Smartphones/ }).click()
    await d.getByRole('button', { name: 'Next' }).click()
    await d.getByText('Samsung A54', { exact: true }).click()
    await d.getByRole('button', { name: 'Discount' }).click()
    await d.getByRole('spinbutton', { name: 'Discount' }).fill('5000')
    await d.getByRole('button', { name: 'Next' }).click()
    await d.getByRole('textbox', { name: 'Customer name' }).pressSequentially('Ada', { delay: 30 })
    await d.getByRole('option', { name: /Ada Okonkwo/ }).click()
    await d.getByRole('combobox', { name: 'Payment method' }).selectOption('Transfer')
    await d.getByRole('textbox', { name: 'Discount reason' }).fill('Loyal customer')
    await d.getByRole('button', { name: /Create sale/ }).click()
    await d.waitFor({ state: 'hidden' })
    await adaSale(page).waitFor()
  },

  steps: [
    {
      say: "Mistakes happen. In this video, you'll fix a sale, refund one, and collect money that's still owed.",
      run: async ({ page, hover }) => hover(page.getByRole('heading', { level: 1 }).first()),
    },
    {
      say: "Here's Ada's sale from the last video. To correct it, open its menu, and choose Edit sale.",
      run: async ({ page, click, wait }) => {
        await click(adaSale(page).getByRole('button', { name: 'Sale actions' }))
        await wait(700)
        await click(page.getByRole('menuitem', { name: 'Edit sale' }))
      },
    },
    {
      say: "You can fix the customer's details and the note. Items and payments stay as they were.",
      run: async ({ page, hover }) =>
        hover(edit(page).getByRole('heading', { name: 'Correct the details' })),
    },
    {
      say: 'Step one: correct the details. Here, Ada has a new phone number.',
      run: async ({ page, click }) => {
        const phone = edit(page).getByRole('textbox', { name: 'PhoneOptional' })
        await click(phone)
        await phone.press('ControlOrMeta+A')
        await phone.pressSequentially('0803 555 7788', { delay: 75 })
      },
    },
    {
      say: 'Step two: say why. The change and the reason are kept in the sale history.',
      run: async ({ page, type }) =>
        type(
          edit(page).getByRole('textbox', { name: 'Reason for this edit' }),
          'Customer changed her number'
        ),
    },
    {
      say: 'Click Save changes.',
      run: async ({ page, click }) =>
        click(edit(page).getByRole('button', { name: 'Save changes' })),
    },
    {
      say: 'The sale is now marked Edited. Its Edit history shows who changed it, when, and why.',
      run: async ({ page, hover, wait }) => {
        await wait(600)
        await hover(page.getByRole('dialog', { name: /^Sale #/ }).getByText('Edit history'))
      },
    },
    {
      say: "Now a refund. This morning's walk-in sale is coming back. Open its menu, and choose Refund.",
      run: async ({ page, click, wait }) => {
        await click(
          page.getByRole('dialog', { name: /^Sale #/ }).getByRole('button', { name: 'Close' })
        )
        await wait(800)
        await click(walkIn(page).getByRole('button', { name: 'Sale actions' }))
        await wait(700)
        await click(page.getByRole('menuitem', { name: 'Refund' }))
      },
    },
    {
      say: 'Step one: check the items coming back. The charger might be faulty, so tick Needs checking, hold it off sale. It stays off sale until someone inspects it.',
      run: async ({ page, hover, click }) => {
        await hover(refund(page).getByRole('heading', { name: 'Check the items coming back' }))
        await click(
          refund(page).getByText('Needs checking, hold it off sale', { exact: true }).nth(1)
        )
      },
    },
    {
      say: 'Step two: note what the customer said is wrong.',
      run: async ({ page, type }) =>
        type(
          refund(page).getByRole('textbox', { name: 'What did the customer say is wrong?' }),
          'Charges very slowly'
        ),
    },
    {
      say: 'Step three: check the refund amount, then tick the box to confirm.',
      run: async ({ page, click, hover, wait }) => {
        await hover(refund(page).getByText('Refund amount', { exact: true }))
        await wait(1200)
        await click(refund(page).getByText(/^I confirm this return/))
      },
    },
    {
      say: 'Then confirm.',
      run: async ({ page, click }) =>
        click(refund(page).getByRole('button', { name: 'Confirm return / refund' })),
    },
    {
      say: 'The amount is struck through. It shows Return pending while the charger waits to be checked.',
      run: async ({ page, hover, wait }) => {
        await wait(700)
        await hover(walkIn(page).getByRole('cell', { name: /Return pending/ }))
      },
    },
    {
      say: 'Now, money still owed. The Outstanding tab lists sales where the customer still owes you.',
      run: async ({ page, click, hover }) => {
        await click(page.getByRole('tab', { name: /Outstanding/ }))
        await hover(page.getByRole('cell', { name: /₦120,000\.00/ }).first())
      },
    },
    {
      say: 'When they pay, click Record payment. Enter the amount, or tap Pay balance or Half.',
      run: async ({ page, click }) => {
        await click(page.getByRole('button', { name: 'Record payment' }).first())
        const amount = pay(page).getByRole('spinbutton', { name: 'Payment amount' })
        await click(amount)
        await amount.press('ControlOrMeta+A')
        await amount.pressSequentially('60000', { delay: 90 })
      },
    },
    {
      say: 'Choose how they paid, then click Record payment to save it.',
      run: async ({ page, hover, wait }) => {
        const method = pay(page).getByRole('combobox', { name: 'Payment method' })
        await hover(method)
        await method.selectOption('Cash')
        await wait(500)
        await hover(pay(page).getByRole('button', { name: 'Record payment' }))
      },
    },
    {
      say: 'Recap: edit with a reason, refund in three steps, and record payments as they come in. Next: your customers.',
      run: async ({ page, click, wait }) => {
        await wait(1200)
        await click(pay(page).getByRole('button', { name: 'Cancel' }))
      },
    },
  ],
}

/** Ada's sale, made in setup (the newest REC- sale). */
function adaSale(page) {
  return page.getByRole('row', { name: /REC-.*Ada Okonkwo/ }).first()
}

/** This morning's walk-in sale in the demo data. */
function walkIn(page) {
  return page.getByRole('row', { name: /DEMO-1002/ })
}

function edit(page) {
  return page.getByRole('dialog', { name: /^Edit sale/ })
}

function refund(page) {
  return page.getByRole('alertdialog', { name: 'Return / refund sale' })
}

function pay(page) {
  return page.getByRole('dialog', { name: 'Record payment' })
}
