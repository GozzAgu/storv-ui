/**
 * Video 13 · Move stock between branches (storyboard in the "Storvv video series" doc).
 * Each step: `say` is the narration; `run` is what happens on screen while it plays.
 *
 * Filmed as the owner, who may act for both branches. Port Harcourt already has an Accessories
 * category in the demo, so the chargers have somewhere to land.
 */
export default {
  id: '13-move-stock-between-branches',
  title: 'Move stock between branches',

  /** Not recorded: a fresh demo on the Overview, in Lagos. */
  async setup({ page }, base) {
    await page.goto(`${base}/demo`, { waitUntil: 'networkidle' })
    await page.goto(`${base}/demo/dashboard`, { waitUntil: 'networkidle' })
    await page.getByRole('link', { name: 'Branch transfers' }).waitFor({ timeout: 60_000 })
  },

  steps: [
    {
      say: "In this video, you'll move stock from Lagos to Port Harcourt, without anything going missing.",
      run: async ({ page, click }) => click(page.getByRole('link', { name: 'Branch transfers' })),
    },
    {
      say: 'Open New transfer. A transfer has three stops: you request it, the sending branch dispatches it, and an admin approves it when it arrives. Stock only moves at the end.',
      run: async ({ page, click, hover, wait }) => {
        await click(page.getByRole('tab', { name: 'New transfer' }))
        await wait(1500)
        const stops = page.getByRole('list', { name: 'How a transfer works' }).getByRole('listitem')
        for (let i = 0; i < 3; i++) {
          await hover(stops.nth(i))
          await wait(1100)
        }
      },
    },
    {
      say: 'Step one: the route. Where it leaves from, Lagos, and where it goes, Port Harcourt.',
      run: async ({ page, hover, wait }) => {
        const from = page.getByRole('combobox', { name: 'From branch' })
        await hover(from)
        await from.selectOption({ label: 'Lagos, Lekki' })
        await wait(1200)
        const to = page.getByRole('combobox', { name: 'To branch' })
        await hover(to)
        await to.selectOption({ label: 'Port Harcourt, GRA' })
      },
    },
    {
      say: "Step two: the category it comes from, and where it'll be filed at the other branch. Accessories, on both sides.",
      run: async ({ page, click, wait }) => {
        await click(
          page
            .getByRole('group', { name: 'Take items from category' })
            .getByRole('button', { name: /Accessories/ })
        )
        await wait(1500)
        await click(
          page
            .getByRole('group', { name: 'Put items in category' })
            .getByRole('button', { name: /Accessories/ })
        )
      },
    },
    {
      say: 'Step three: how many of each item to move. Five chargers.',
      run: async ({ page, type }) =>
        type(page.getByRole('spinbutton', { name: 'Quantity of 20W USB-C charger to move' }), '5'),
    },
    {
      say: "Add a note if it helps. The bar at the bottom confirms what's going where. Then click Request transfer.",
      run: async ({ page, type, hover, click, wait }) => {
        await type(page.getByRole('textbox', { name: 'Notes (optional)' }), 'For the weekend rush')
        await hover(page.getByText('5 units', { exact: true }))
        await wait(1500)
        await click(page.getByRole('button', { name: 'Request transfer' }))
      },
    },
    {
      say: 'It appears in History, with its own reference, waiting to be dispatched.',
      run: async ({ page, click, hover, wait }) => {
        await click(page.getByRole('tab', { name: /History/ }))
        await wait(700)
        await hover(newRow(page).getByRole('cell').nth(1))
        await wait(1000)
        await hover(newRow(page).getByText('Awaiting dispatch'))
      },
    },
    {
      say: 'When it leaves Lagos, open its actions and choose Dispatch.',
      run: async ({ page, click, wait }) => {
        await click(newRow(page).getByRole('button', { name: 'Transfer actions' }))
        await wait(500)
        await click(page.getByRole('menuitem', { name: 'Dispatch' }))
      },
    },
    {
      say: 'You can add the carrier and tracking number too, so the other branch can follow the delivery.',
      run: async ({ page, click, type, wait }) => {
        await click(newRow(page).getByRole('button', { name: 'Transfer actions' }))
        await wait(400)
        await click(page.getByRole('menuitem', { name: 'Add tracking' }))
        const d = page.getByRole('dialog', { name: 'Shipment tracking' })
        await type(d.getByRole('textbox', { name: 'Carrier' }), 'GIG Logistics')
        await type(d.getByRole('textbox', { name: 'Tracking number' }), '4471902385')
        await click(d.getByRole('button', { name: 'Save' }))
      },
    },
    {
      say: 'Open a transfer to see the route, a timeline of each stage, and every item.',
      run: async ({ page, click }) =>
        click(newRow(page).getByRole('button', { name: /Show details for transfer/ })),
    },
    {
      say: 'Now switch to Port Harcourt. At the receiving branch, Storvv tells you a transfer is waiting to be checked in.',
      run: async ({ page, click, hover, wait }) => {
        await click(page.getByRole('button', { name: /Current branch/ }))
        await wait(400)
        await click(page.getByRole('option', { name: /Port Harcourt/ }))
        await wait(1200)
        await hover(page.getByRole('status').filter({ hasText: 'waiting for you' }))
      },
    },
    {
      say: "Check the goods. If something's wrong, choose Reject and give a reason, and the stock stays with the sender.",
      run: async ({ page, click, hover }) => {
        await click(newRow(page).getByRole('button', { name: 'Transfer actions' }))
        await hover(page.getByRole('menuitem', { name: 'Reject' }))
      },
    },
    {
      say: 'If all is well, choose Approve into inventory. Now the stock moves.',
      run: async ({ page, click, hover, wait }) => {
        await click(page.getByRole('menuitem', { name: 'Approve into inventory' }))
        await wait(1200)
        await hover(newRow(page).getByRole('cell').nth(5))
      },
    },
    {
      say: 'Who can approve? An admin of the receiving branch, like Chioma, or the owner. Nobody from the sending branch can approve their own transfer, and neither can the person who asked for it.',
      run: async ({ page, hover, wait }) => {
        await hover(newRow(page).getByRole('cell').nth(3))
        await wait(2500)
        await hover(newRow(page).getByRole('cell').nth(2))
      },
    },
    {
      say: 'Every transfer has a reference, like T R and six letters. Search for it to jump straight to it.',
      run: async ({ page, click, type, hover }) => {
        const ref = (await newRow(page).getByRole('cell').nth(1).innerText()).match(/TR-\w+/)[0]
        await click(page.getByRole('button', { name: /^Search/ }))
        await type(page.getByRole('combobox', { name: 'Search' }), ref)
        await hover(page.getByRole('option', { name: new RegExp(ref) }))
      },
    },
    {
      say: 'Branch reports compares how each branch is selling. Recap: request, dispatch, approve. Next: lending stock to resellers.',
      run: async ({ page, click }) => {
        await page.keyboard.press('Escape')
        await click(page.getByRole('tab', { name: 'Branch reports' }))
      },
    },
  ],
}

/** The transfer this video creates: the newest row, Lagos to Port Harcourt. */
function newRow(page) {
  return page
    .getByRole('row', { name: /details for transfer TR-/ })
    .filter({ hasText: '20W USB-C charger × 5' })
    .first()
}
