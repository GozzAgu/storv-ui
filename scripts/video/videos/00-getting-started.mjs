/**
 * Video 0 · Getting started with Storvv (storyboard in the "Storvv video series" doc).
 * Each step: `say` is the narration; `run` is what happens on screen while it plays.
 *
 * The marketing links point at app.storvv.com/signup; the recording sends them to the local
 * sign-up page instead, and nothing is submitted. The store-setup screen can't be reached in
 * the demo, so it is described over the sign-up page's own "Set up your store" step.
 */
export default {
  id: '00-getting-started',
  title: 'Getting started with Storvv',

  /** Not recorded: the homepage, cookie banner answered, sign-up links kept on this server. */
  async setup({ page }, base) {
    await page.route('https://app.storvv.com/signup**', (route) =>
      route.fulfill({ status: 302, headers: { location: `${base}/signup` } })
    )
    await page.goto(`${base}/`, { waitUntil: 'networkidle' })
    const essential = page.getByRole('button', { name: 'Essential only' })
    if (await essential.isVisible().catch(() => false)) await essential.click()
    await page.getByRole('heading', { level: 1 }).first().waitFor({ timeout: 60_000 })
  },

  steps: [
    {
      say: "In two minutes, you'll set up Storvv and learn your way around.",
      run: async ({ page, hover }) => hover(page.getByRole('heading', { level: 1 }).first()),
    },
    {
      say: "Storvv is point of sale and inventory for your shop. Every sale updates your stock, your receipts and your customers' balances at once.",
      run: async ({ page, hover }) =>
        hover(page.getByRole('main').getByRole('link', { name: 'Create your free store' }).first()),
    },
    {
      say: 'To start, click Start free.',
      lead: 300,
      run: async ({ page, click }) => {
        await click(page.getByRole('banner').getByRole('link', { name: 'Start free' }))
        await page.getByRole('heading', { name: 'Create your account' }).waitFor()
      },
    },
    {
      say: 'Sign up with Google, or with your business name, your email and a password.',
      run: async ({ page, hover, wait }) => {
        await hover(page.getByRole('button', { name: 'Sign up with Google' }))
        await wait(900)
        await hover(page.getByRole('textbox', { name: 'Your business name' }))
        await hover(page.getByRole('textbox', { name: 'Email' }))
        await hover(page.getByRole('textbox', { name: 'Password' }))
      },
    },
    {
      say: 'If you use email, open the message we send you, tap verify, then sign in.',
      run: async ({ page, hover }) =>
        hover(page.getByRole('button', { name: 'Create your free store' })),
    },
    {
      say: 'Next, Storvv sets up your store in three short steps: your currency and country, how you run your business, and your head branch, with its address and what you sell.',
      run: async ({ page, hover }) =>
        hover(page.getByRole('listitem').filter({ hasText: 'Set up your store and branches' })),
    },
    {
      say: "Now, let's look inside. This is the demo shop, filled with sample data. You start on the Overview.",
      lead: 0,
      run: async ({ page }) => {
        const base = new URL(page.url()).origin
        await page.goto(`${base}/demo`, { waitUntil: 'networkidle' })
        await page.getByRole('link', { name: /^Revenue/ }).waitFor({ timeout: 60_000 })
      },
    },
    {
      say: "At the top: your revenue, today's sales, money customers still owe you, and anything running low.",
      run: async ({ page, hover, wait }) => {
        for (const name of [/^Revenue/, /^Sales today/, /^Outstanding/, /^Low stock/]) {
          await hover(page.getByRole('link', { name }).first())
          await wait(500)
        }
      },
    },
    {
      say: 'Below, your recent sales and anything that needs attention. Add product and New sale are always at the top.',
      run: async ({ page, hover, wait }) => {
        await hover(page.getByRole('heading', { name: 'Recent sales' }))
        await wait(1200)
        await hover(page.getByRole('heading', { name: 'Needs attention' }))
        await wait(800)
        await hover(page.getByRole('main').getByRole('link', { name: 'Add product' }))
        await hover(page.getByRole('main').getByRole('link', { name: 'New sale' }))
      },
    },
    {
      say: 'The side menu takes you everywhere. Inventory holds your products. Sales is where you sell and see receipts. Customers keeps your contacts. Reports shows how the business is doing.',
      run: async ({ page, hover, wait }) => {
        const nav = page.getByRole('navigation', { name: 'Sections' })
        for (const name of ['Inventory', 'Sales', 'Customers', 'Reports']) {
          await hover(nav.getByRole('link', { name, exact: true }))
          await wait(1700)
        }
      },
    },
    {
      say: "Under Operations and Organization you'll find transfers, branches, staff and more. Each has its own short video.",
      run: async ({ page, hover, wait }) => {
        const nav = page.getByRole('navigation', { name: 'Sections' })
        await hover(nav.getByText('Operations', { exact: true }))
        await wait(900)
        await hover(nav.getByText('Organization', { exact: true }))
      },
    },
    {
      say: 'If you have more than one branch, switch between them here.',
      run: async ({ page, click, hover, wait }) => {
        await click(page.getByRole('button', { name: /Current branch/ }))
        const list = page.getByRole('listbox', { name: 'Branches' })
        await hover(list.getByRole('option', { name: /Abuja/ }))
        await hover(list.getByRole('option', { name: /Port Harcourt/ }))
        await wait(400)
        await page.keyboard.press('Escape')
      },
    },
    {
      say: 'To find anything fast, press Command K, or Control K on Windows. Then type a product, a customer or a sale.',
      run: async ({ page, hover, type, wait }) => {
        await hover(page.getByRole('button', { name: 'Search' }))
        await page.keyboard.press('Meta+k')
        await wait(1600)
        await type(page.getByRole('combobox', { name: 'Search' }), 'iPhone')
        await wait(2200)
        await page.keyboard.press('Escape')
      },
    },
    {
      say: "That's the tour. Next, set up your categories so your stock has a home.",
      run: async ({ page, hover }) =>
        hover(
          page
            .getByRole('navigation', { name: 'Sections' })
            .getByRole('link', { name: 'Inventory' })
        ),
    },
  ],
}
