/**
 * Video 12 · Add a branch (storyboard in the "Storvv video series" doc).
 * Each step: `say` is the narration; `run` is what happens on screen while it plays.
 */
export default {
  id: '12-add-a-branch',
  title: 'Add a branch',

  /** Not recorded: a fresh demo (3 branches, Enterprise allows 5), on the Overview page. */
  async setup({ page }, base) {
    await page.goto(`${base}/demo`, { waitUntil: 'networkidle' })
    await page.goto(`${base}/demo/dashboard`, { waitUntil: 'networkidle' })
    await nav(page, 'Branches').waitFor({ timeout: 60_000 })
  },

  steps: [
    {
      say: "In this video, you'll add a branch, and switch between your branches.",
      run: async ({ page, click, hover }) => {
        await click(nav(page, 'Branches'))
        await hover(page.getByRole('region', { name: 'Branches' }))
      },
    },
    {
      say: 'Here are your branches, and how many your plan allows. Click Add branch.',
      run: async ({ page, hover, click, wait }) => {
        await hover(page.getByText('Plan allows', { exact: true }))
        await wait(1200)
        await click(page.getByRole('button', { name: 'Add branch' }).first())
      },
    },
    {
      say: 'Step one: where it is. Choose the city, and type the area. Storvv names the branch after them, so it is easy to tell apart.',
      run: async ({ page, click, type, wait }) => {
        const city = form(page).getByRole('combobox', { name: 'City' })
        await click(city)
        await city.selectOption('Ibadan')
        await wait(400)
        await type(form(page).getByRole('textbox', { name: 'Area' }), 'Ring Road')
      },
    },
    {
      say: 'Step two is optional: contact details. They are printed on receipts, so customers can reach this branch.',
      run: async ({ page, type }) => {
        await type(form(page).getByRole('textbox', { name: 'Address' }), '14 Ring Road, Ibadan')
        await type(form(page).getByRole('textbox', { name: 'Phone' }), '0803 222 1100')
      },
    },
    {
      say: "Step three: a note for cashiers. They'll see it on Quick sale and at checkout.",
      run: async ({ page, type }) =>
        type(
          form(page).getByRole('textbox', { name: 'Note for cashiers' }),
          '10% off accessories today'
        ),
    },
    {
      say: 'The summary shows the new branch. Click Add branch.',
      run: async ({ page, hover, click, wait }) => {
        await hover(
          form(page)
            .getByRole('contentinfo')
            .getByText(/will be added as a new branch/)
        )
        await wait(1200)
        await click(form(page).getByRole('contentinfo').getByRole('button', { name: 'Add branch' }))
      },
    },
    {
      say: "Here it is. To work in it, open the branch's menu, and click Switch to this branch.",
      run: async ({ page, hover, click, wait }) => {
        await dismissToasts(page)
        await hover(page.getByRole('cell', { name: 'Ibadan, Ring Road', exact: true }))
        await wait(800)
        await click(page.getByRole('button', { name: 'Actions for Ibadan, Ring Road' }))
        await click(page.getByRole('menuitem', { name: 'Switch to this branch' }))
      },
    },
    {
      say: 'Or switch any time from the branch picker, at the top left. Stock, sales and staff are kept separately for each branch.',
      run: async ({ page, click, wait }) => {
        await dismissToasts(page)
        await click(page.getByRole('button', { name: /Change branch/ }))
        await wait(1200)
        await click(page.getByRole('option', { name: 'Lagos Lekki' }))
      },
    },
    {
      say: "That's branches: choose the city and area, add contact details, and switch from the picker. Next, moving stock between branches.",
      run: async ({ page, hover }) => {
        await dismissToasts(page)
        await hover(page.getByRole('button', { name: /Current branch: Lagos/ }))
      },
    },
  ],
}

/** A link in the side menu. */
function nav(page, name) {
  return page.getByRole('navigation', { name: 'Sections' }).getByRole('link', { name, exact: true })
}

function form(page) {
  return page.getByRole('dialog', { name: 'Add branch' })
}

/** Close success toasts so they don't sit over the next screens. */
async function dismissToasts(page) {
  for (const close of await page.getByRole('button', { name: 'Dismiss' }).all()) {
    await close.click().catch(() => {})
  }
}
