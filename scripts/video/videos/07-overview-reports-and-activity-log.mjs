/**
 * Video 7 · Overview, reports and the activity log (storyboard in the "Storvv video series" doc).
 * Uses the demo's sample sales as they are; the PDF and Excel buttons are pointed at, not clicked.
 * Each step: `say` is the narration; `run` is what happens on screen while it plays.
 */
export default {
  id: '07-overview-reports-and-activity-log',
  title: 'Overview, reports and the activity log',

  /** Not recorded: a fresh demo, on the Overview page. */
  async setup({ page }, base) {
    await page.goto(`${base}/demo`, { waitUntil: 'networkidle' })
    await page.goto(`${base}/demo/dashboard`, { waitUntil: 'networkidle' })
    await page.getByRole('link', { name: /^Sales today/ }).waitFor({ timeout: 60_000 })
  },

  steps: [
    {
      say: "In this video, you'll see how your business is doing, and who changed what.",
      run: async ({ page, hover }) => hover(page.getByRole('heading', { level: 2 }).first()),
    },
    {
      say: "Overview is your morning check: revenue, today's sales, money owed to you, and items running low.",
      run: async ({ page, hover, wait }) => {
        for (const card of [/^Revenue/, /^Sales today/, /^Outstanding/, /^Low stock \d/]) {
          await hover(page.getByRole('link', { name: card }).first())
          await wait(500)
        }
      },
    },
    {
      say: 'Further down, Needs attention lists what to deal with, like unpaid balances and stock running low.',
      run: async ({ page, hover, wait }) => {
        await hover(page.getByRole('heading', { name: 'Needs attention' }))
        await wait(900)
        await hover(page.getByRole('link', { name: /^Outstanding balances/ }))
        await wait(900)
        await hover(page.getByRole('heading', { name: 'Low stock', exact: true }))
      },
    },
    {
      say: 'For more detail, open Reports, and choose the period.',
      run: async ({ page, click, hover }) => {
        await click(page.getByRole('link', { name: 'Reports', exact: true }))
        await hover(page.getByRole('combobox', { name: 'Period' }))
      },
    },
    {
      say: 'The tabs show revenue over time, your top products and customers, how people pay and your busiest times, top lists, and stock you have lost.',
      run: async ({ page, click, wait }) => {
        for (const tab of [
          'Revenue',
          'Products & customers',
          'Payments & busy times',
          'Top lists',
          'Stock losses',
        ]) {
          await click(page.getByRole('tab', { name: tab }))
          await wait(700)
        }
      },
    },
    {
      say: 'Busiest times show your best day and your best hour, so you can plan staff for the rush.',
      run: async ({ page, click, hover, wait }) => {
        await click(page.getByRole('tab', { name: 'Payments & busy times' }))
        await wait(500)
        await hover(page.getByRole('heading', { name: 'Busiest times' }))
        await wait(1000)
        await hover(page.getByRole('heading', { name: 'Sales by hour' }))
      },
    },
    {
      say: 'Need it for your accountant? Click PDF or Excel to download the report.',
      run: async ({ page, hover, wait }) => {
        await hover(page.getByRole('button', { name: 'PDF' }))
        await wait(1000)
        await hover(page.getByRole('button', { name: 'Excel' }))
      },
    },
    {
      say: 'Activity log is a dated record of what happens in this branch, and who did it.',
      run: async ({ page, click }) => click(page.getByRole('link', { name: 'Activity log' })),
    },
    {
      say: 'Search by person, item or record. Or filter by the kind of change: created, updated or deleted.',
      run: async ({ page, type, click, wait }) => {
        const search = page.getByRole('searchbox', {
          name: 'Search activity by person, item or record ID',
        })
        await type(search, 'Stock')
        await wait(1200)
        await search.press('ControlOrMeta+A')
        await search.press('Backspace')
        await click(page.getByRole('tab', { name: /^Updated/ }))
        await wait(1000)
        await click(page.getByRole('tab', { name: /^All/ }))
      },
    },
    {
      say: 'Point at any entry to see who did it, exactly when, and which record it was.',
      run: async ({ page, hover }) =>
        hover(page.getByRole('button', { name: /^Details: Sale recorded/ })),
    },
    {
      say: 'Recap: Overview for today, Reports for trends, and Activity log for who did what. Next: customer trade-ins, when you buy items from customers.',
      run: async ({ page, click }) =>
        click(page.getByRole('link', { name: 'Overview', exact: true })),
    },
  ],
}
