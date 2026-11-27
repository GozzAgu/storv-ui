/**
 * Video 11 · Add your team (storyboard in the "Storvv video series" doc).
 * Each step: `say` is the narration; `run` is what happens on screen while it plays.
 *
 * Demo limits: demo staff have no real login, so the Admin section of Edit staff never shows
 * and nobody can be made admin here. The narration says so instead of pretending.
 */
export default {
  id: '11-add-your-team',
  title: 'Add your team',

  /** Not recorded: a fresh demo on the Overview, in Lagos. */
  async setup({ page }, base) {
    await page.goto(`${base}/demo`, { waitUntil: 'networkidle' })
    await page.goto(`${base}/demo/dashboard`, { waitUntil: 'networkidle' })
    await page.getByRole('link', { name: 'Staff & roles' }).waitFor({ timeout: 60_000 })
  },

  steps: [
    {
      say: "In this video, you'll add two people to your team: a cashier, and a branch manager you trust with more.",
      run: async ({ page, click }) => click(page.getByRole('link', { name: 'Staff & roles' })),
    },
    {
      say: 'Staff belong to departments, like Sales or Operations. Departments also decide which inventory people can see.',
      run: async ({ page, hover, wait }) => {
        await hover(
          page
            .getByRole('row', { name: /Select Sales/ })
            .getByRole('cell')
            .nth(1)
        )
        await wait(1500)
        await hover(
          page
            .getByRole('row', { name: /Select Operations/ })
            .getByRole('cell')
            .nth(1)
        )
      },
    },
    {
      say: "Staff are added per branch, and we're in Lagos. Open a department, here Sales, and click Add staff.",
      run: async ({ page, hover, click, wait }) => {
        await hover(page.getByRole('button', { name: /Current branch/ }))
        await wait(1200)
        await click(
          page
            .getByRole('row', { name: /Select Sales/ })
            .getByRole('cell')
            .nth(1)
        )
        await wait(900)
        await click(page.getByRole('button', { name: 'Add staff' }).first())
      },
    },
    {
      say: "Step one: who they are. This is Tunde Bello, our new cashier. He'll sign in with this email.",
      run: async (act) => fillWho(act, 'Tunde', 'Bello', 'tunde@example.com', 'Cashier'),
    },
    {
      say: 'Step two: how they get their password. Storvv can email them their sign-in details, or you copy the password and give it to them.',
      run: async ({ page, hover }) =>
        hover(addStaff(page).getByRole('checkbox', { name: /Email sign-in details/ })),
    },
    {
      say: 'Step three: job details. The hire date starts as today, and salary is optional. It is just for your records.',
      run: async ({ page, hover, wait }) => {
        await hover(addStaff(page).getByRole('textbox', { name: 'Hire date' }))
        await wait(1500)
        await hover(addStaff(page).getByRole('spinbutton', { name: /Salary/ }))
      },
    },
    {
      say: 'Step four: what they can do. Tunde can create sales, but Refund and cancel orders is off. Turn on only what each person needs.',
      run: async ({ page, hover, wait }) => {
        const receipts = addStaff(page).getByRole('group', { name: 'Receipts actions' })
        await hover(receipts.getByRole('checkbox', { name: 'Create', exact: true }))
        await wait(1500)
        await hover(receipts.getByRole('checkbox', { name: 'Refund and cancel orders' }))
      },
    },
    {
      say: 'The summary at the bottom confirms who joins where. Click Add staff and email invite.',
      run: async ({ page, hover, click, wait }) => {
        await hover(addStaff(page).getByRole('contentinfo').getByRole('paragraph').first())
        await wait(1500)
        await click(addStaff(page).getByRole('button', { name: /Add staff and/ }))
      },
    },
    {
      say: 'Storvv confirms the invite. Click Done, and Tunde is on the Sales team.',
      run: async ({ page, click, hover, wait }) => {
        await wait(800)
        await click(addStaff(page).getByRole('button', { name: 'Done' }))
        await wait(600)
        await hover(
          page
            .getByRole('row', { name: /Tunde Bello/ })
            .getByRole('cell')
            .nth(1)
        )
      },
    },
    {
      say: 'Now a manager for Port Harcourt. Switch branch to Port Harcourt, then open Staff and roles again.',
      run: async ({ page, click, wait }) => {
        await click(page.getByRole('button', { name: /Current branch/ }))
        await wait(400)
        await click(page.getByRole('option', { name: /Port Harcourt/ }))
        await wait(700)
        await click(page.getByRole('link', { name: 'Staff & roles' }))
      },
    },
    {
      say: 'Open Operations, and add Chioma Eze the same way, as Branch manager.',
      run: async (act) => {
        const { page, click, wait } = act
        await click(
          page
            .getByRole('row', { name: /Select Operations/ })
            .getByRole('cell')
            .nth(1)
        )
        await wait(700)
        await click(page.getByRole('button', { name: 'Add staff' }).first())
        await fillWho(act, 'Chioma', 'Eze', 'chioma@example.com', 'Branch manager')
      },
    },
    {
      say: 'Chioma will move stock between branches, so set Transfers to Manage.',
      run: async ({ page, click }) =>
        click(
          addStaff(page)
            .getByRole('radiogroup', { name: 'Transfers' })
            .getByRole('radio', { name: 'Manage' })
        ),
    },
    {
      say: 'Click Add staff and email invite, then Done.',
      run: async ({ page, click, wait }) => {
        await click(addStaff(page).getByRole('button', { name: /Add staff and/ }))
        await wait(1200)
        await click(addStaff(page).getByRole('button', { name: 'Done' }))
      },
    },
    {
      say: "In your own store, you can go one step further and make a trusted manager an admin. Choose Edit on their row, and switch on Make admin of the branch. The demo can't show this part, because demo staff have no real login.",
      run: async ({ page, hover }) =>
        hover(page.getByRole('button', { name: 'Actions for Chioma Eze' })),
    },
    {
      say: 'An admin runs their branch: sales, refunds, stock and regular staff. Extra powers, like Transfer stock to other branches and Approve stock loans, stay with you until you switch them on, one by one. If you use two-factor sign-in, Storvv asks for your authenticator code first.',
      run: async ({ page, hover }) =>
        hover(
          page
            .getByRole('row', { name: /Chioma Eze/ })
            .getByRole('cell')
            .nth(1)
        ),
    },
    {
      say: 'Each person has their own login, so every sale and change shows who did it in the Activity log.',
      run: async ({ page, hover }) => hover(page.getByRole('link', { name: 'Activity log' })),
    },
    {
      say: 'Recap: add staff per branch, give them only what they need, and make trusted managers admins. Next: adding a branch.',
    },
  ],
}

/** The Add staff drawer. */
function addStaff(page) {
  return page.getByRole('dialog', { name: 'Add staff' })
}

/** Step one of Add staff: name, email and position. */
async function fillWho({ page, type }, first, last, email, position) {
  const d = addStaff(page)
  await type(d.getByRole('textbox', { name: 'First name' }), first)
  await type(d.getByRole('textbox', { name: 'Last name' }), last)
  await type(d.getByRole('textbox', { name: 'Email' }), email)
  await type(d.getByRole('textbox', { name: 'Position' }), position)
}
