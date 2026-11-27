/**
 * Video 10 · Sales leads (storyboard in the "Storvv video series" doc).
 * Each step: `say` is the narration; `run` is what happens on screen while it plays.
 */
export default {
  id: '10-sales-leads',
  title: 'Sales leads',

  /** Not recorded: a fresh demo, on the Overview page. */
  async setup({ page }, base) {
    await page.goto(`${base}/demo`, { waitUntil: 'networkidle' })
    await page.goto(`${base}/demo/dashboard`, { waitUntil: 'networkidle' })
    await nav(page, 'Sales leads').waitFor({ timeout: 60_000 })
  },

  steps: [
    {
      say: "In this video, you'll turn an enquiry into a sale you don't forget.",
      run: async ({ page, click }) => click(nav(page, 'Sales leads')),
    },
    {
      say: "Someone asks about a phone, but isn't ready to buy. Click Add lead.",
      run: async ({ page, click }) => click(page.getByRole('button', { name: 'Add lead' }).first()),
    },
    {
      say: "Step one: who's enquiring. Add a phone or email, so you can follow up.",
      run: async ({ page, type }) => {
        await type(form(page).getByRole('textbox', { name: 'Customer name' }), 'Bola Adeyemi')
        await type(form(page).getByRole('textbox', { name: /^Phone/ }), '0802 555 0199')
      },
    },
    {
      say: 'Step two: what they want. You can also link the exact product from your stock. Search, then click Find item.',
      run: async ({ page, type, click, hover }) => {
        await type(form(page).getByRole('textbox', { name: 'Product interest' }), 'iPhone 13')
        await type(form(page).getByRole('textbox', { name: /Link inventory item/ }), 'iPhone')
        await click(form(page).getByRole('button', { name: 'Find item' }))
        await hover(form(page).getByText('Linked:'))
      },
    },
    {
      say: "Step three: the details. What it could be worth, where the lead came from, and anything you'll want to remember.",
      run: async ({ page, type, click }) => {
        await type(form(page).getByRole('spinbutton', { name: /Estimated value/ }), '485000')
        const source = form(page).getByRole('combobox', { name: 'Source' })
        await click(source)
        await source.selectOption('WhatsApp')
        await type(form(page).getByRole('textbox', { name: /Notes/ }), 'Wants it in blue.')
      },
    },
    {
      say: "The summary sums it up. Click Save lead. If an open lead already exists for this person, Storvv warns you, so you don't add them twice.",
      run: async ({ page, hover, click, wait }) => {
        await hover(
          form(page)
            .getByRole('contentinfo')
            .getByText(/wants iPhone 13/)
        )
        await wait(1500)
        await click(form(page).getByRole('button', { name: 'Save lead' }))
      },
    },
    {
      say: 'The lead opens. After each call, add a note here, so anyone can pick it up.',
      run: async ({ page, hover, wait }) => {
        await dismissToasts(page)
        await hover(page.getByRole('textbox', { name: 'Add a note' }))
        await wait(1200)
        await hover(page.getByRole('button', { name: 'Save note' }))
      },
    },
    {
      say: 'Under Follow-up, set the status as things move, and choose who follows up.',
      run: async ({ page, hover, click, wait }) => {
        await hover(page.getByRole('combobox', { name: 'Status' }))
        await wait(1200)
        const assigned = page.getByRole('combobox', { name: 'Assigned to' })
        await click(assigned)
        await assigned.selectOption('Amaka Nwosu')
      },
    },
    {
      say: "If they decide not to buy, click Mark as lost, and note why, such as price. We'll cancel here.",
      run: async ({ page, click, type, wait }) => {
        await dismissToasts(page)
        await click(page.getByRole('button', { name: 'Mark as lost' }))
        await type(lost(page).getByRole('textbox', { name: 'Reason (optional)' }), 'Price')
        await wait(600)
        await click(lost(page).getByRole('button', { name: 'Cancel' }))
      },
    },
    {
      say: 'When they come in to buy, click Create sale. Their details and the linked phone are already filled in.',
      run: async ({ page, click, hover }) => {
        await click(page.getByRole('button', { name: 'Create sale' }))
        await hover(sale(page).getByRole('textbox', { name: 'Customer name' }))
      },
    },
    {
      say: 'Complete the sale, and the lead is marked Won, with a link to the receipt.',
      run: async ({ page, click, hover, wait }) => {
        await click(sale(page).getByRole('button', { name: /Create sale ·/ }))
        await wait(700)
        await dismissToasts(page)
        await hover(page.getByRole('link', { name: 'View receipt' }))
      },
    },
    {
      say: "Back on Sales leads, the tabs show what's open, won or lost.",
      run: async ({ page, click, hover, wait }) => {
        await click(nav(page, 'Sales leads'))
        await click(page.getByRole('tab', { name: /^Won/ }))
        await wait(600)
        await hover(page.getByRole('link', { name: 'Bola Adeyemi' }))
      },
    },
    {
      say: "That's leads: log it, follow up, then mark it won or lost. Next, adding your team.",
    },
  ],
}

/** A link in the side menu. */
function nav(page, name) {
  return page.getByRole('navigation', { name: 'Sections' }).getByRole('link', { name, exact: true })
}

function form(page) {
  return page.getByRole('dialog', { name: 'Add sales lead' })
}

function lost(page) {
  return page.getByRole('dialog', { name: 'Mark lead as lost' })
}

function sale(page) {
  return page.getByRole('dialog', { name: 'New sale' })
}

/** Close success toasts so they don't sit over the next screens. */
async function dismissToasts(page) {
  for (const close of await page.getByRole('button', { name: 'Dismiss' }).all()) {
    await close.click().catch(() => {})
  }
}
