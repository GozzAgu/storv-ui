/**
 * Video 6 · Your customers and what they owe (storyboard in the "Storvv video series" doc).
 * Setup makes two sales with new customer names so the list has more than Ada in it.
 * Each step: `say` is the narration; `run` is what happens on screen while it plays.
 */
export default {
  id: '06-customers-and-what-they-owe',
  title: 'Your customers and what they owe',

  /** Not recorded: a fresh demo with two more named customers, on the Sales page. */
  async setup({ page }, base) {
    await page.goto(`${base}/demo`, { waitUntil: 'networkidle' })
    await page.goto(`${base}/demo/dashboard/receipts`, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'New sale' }).first().waitFor({ timeout: 60_000 })

    await sell(page, {
      path: ['Phones', 'Smartphones'],
      product: 'Samsung A54',
      customer: 'Emeka Obi',
      method: 'Cash',
    })
    await sell(page, {
      path: ['Accessories'],
      product: 'Silicone phone case',
      customer: 'Chidinma Nwosu',
      method: 'Transfer',
    })
  },

  steps: [
    {
      say: "In this video, you'll find a customer, and keep track of what they owe you. Click Customers in the side menu.",
      run: async ({ page, click }) =>
        click(page.getByRole('link', { name: 'Customers', exact: true })),
    },
    {
      say: 'Storvv saves customers as you sell. Type a name at checkout, and they appear here, with their orders, what they spent, and what they owe.',
      run: async ({ page, hover, wait }) => {
        await wait(800)
        await hover(customerRow(page, 'Emeka Obi'))
        await wait(1500)
        await hover(customerRow(page, 'Ada Okonkwo').getByRole('cell', { name: '₦120,000.00' }))
      },
    },
    {
      say: 'Use the tabs to see everyone, your repeat customers, or people who owe you money.',
      run: async ({ page, click, wait }) => {
        await click(page.getByRole('tab', { name: /^Repeat/ }))
        await wait(900)
        await click(page.getByRole('tab', { name: /^Owe money/ }))
        await wait(900)
        await click(page.getByRole('tab', { name: /^All/ }))
      },
    },
    {
      say: 'Sort by recent, name, orders, or how much they spent. Or search by name, phone or email.',
      run: async ({ page, hover, type, wait }) => {
        const sort = page.getByRole('combobox', { name: 'Sort by' })
        await hover(sort)
        await sort.selectOption({ label: 'Sort: Spent' })
        await wait(1200)
        await type(
          page.getByRole('searchbox', { name: 'Search customers by name, phone or email' }),
          'Ada'
        )
      },
    },
    {
      say: 'Open a customer to see their contact details, and every purchase.',
      run: async ({ page, click, hover, wait }) => {
        await click(
          customerRow(page, 'Ada Okonkwo').getByRole('button', { name: 'Customer actions' })
        )
        await wait(600)
        await click(page.getByRole('menuitem', { name: 'View details' }))
        await wait(1000)
        await hover(
          page.getByRole('dialog', { name: 'Ada Okonkwo' }).getByRole('heading', { name: 'Sales' })
        )
      },
    },
    {
      say: 'Ada still owes on one sale. To track money a customer owes, click Manage balance.',
      run: async ({ page, hover, click, wait }) => {
        const details = page.getByRole('dialog', { name: 'Ada Okonkwo' })
        await hover(details.getByRole('region', { name: 'Balance' }))
        await wait(1200)
        await click(details.getByRole('button', { name: 'Manage balance' }))
      },
    },
    {
      say: 'Use Add charge when they take goods now and pay later. Enter the amount, add a note, and save.',
      run: async ({ page, click, type, hover }) => {
        await click(balance(page).getByRole('tab', { name: 'Add charge' }))
        await type(balance(page).getByRole('spinbutton', { name: 'Amount' }), '20000')
        await type(
          balance(page).getByRole('textbox', { name: 'NoteOptional' }),
          'Two phone cases, paying Friday'
        )
        await hover(balance(page).getByRole('button', { name: 'Save' }))
      },
    },
    {
      say: 'When they pay you back, choose Record payment, and enter what they paid. Recent activity lists every charge and payment.',
      run: async ({ page, click, hover, wait }) => {
        await click(balance(page).getByRole('tab', { name: 'Record payment' }))
        await balance(page).getByRole('textbox', { name: 'NoteOptional' }).fill('')
        const amount = balance(page).getByRole('spinbutton', { name: 'Amount' })
        await click(amount)
        await amount.press('ControlOrMeta+A')
        await amount.pressSequentially('10000', { delay: 75 })
        await wait(400)
        await hover(balance(page).getByRole('heading', { name: 'Recent activity' }))
      },
    },
    {
      say: 'Everyone who owes you is in one place, under Owe money.',
      run: async ({ page, click, wait }) => {
        await click(balance(page).getByRole('contentinfo').getByRole('button', { name: 'Close' }))
        await wait(500)
        const details = page.getByRole('dialog', { name: 'Ada Okonkwo' })
        if (await details.isVisible()) await click(details.getByRole('button', { name: 'Close' }))
        await click(
          page.getByRole('searchbox', { name: 'Search customers by name, phone or email' })
        )
        await page.keyboard.press('ControlOrMeta+A')
        await page.keyboard.press('Backspace')
        await click(page.getByRole('tab', { name: /^Owe money/ }))
      },
    },
    {
      say: 'Recap: customers are saved as you sell, and balances show who owes what. Next: your reports.',
      run: async ({ page, hover }) => hover(customerRow(page, 'Ada Okonkwo')),
    },
  ],
}

/** A completed New sale, made quickly off camera. */
async function sell(page, { path, product, customer, method }) {
  await page.getByRole('button', { name: 'New sale' }).first().click()
  const d = page.getByRole('dialog', { name: 'New sale' })
  for (const name of path) {
    await d.getByRole('button', { name: new RegExp(`^${name}`) }).click()
    await d.getByRole('button', { name: 'Next' }).click()
  }
  await d.getByText(product, { exact: true }).click()
  await d.getByRole('button', { name: 'Next' }).click()
  await d.getByRole('textbox', { name: 'Customer name' }).fill(customer)
  await d.getByRole('combobox', { name: 'Payment method' }).selectOption(method)
  await d.getByRole('button', { name: /Create sale/ }).click()
  await d.waitFor({ state: 'hidden' })
}

function customerRow(page, name) {
  return page.getByRole('row', { name: new RegExp(`^${name}`) })
}

function balance(page) {
  return page.getByRole('dialog', { name: 'Customer balance' })
}
