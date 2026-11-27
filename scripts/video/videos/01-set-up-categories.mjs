/**
 * Video 1 · Set up your categories (storyboard in the "Storvv video series" doc).
 * Each step: `say` is the narration; `run` is what happens on screen while it plays.
 */
export default {
  id: '01-set-up-categories',
  title: 'Set up your categories',

  /** Not recorded: a fresh demo, already on the Inventory page. */
  async setup({ page }, base) {
    await page.goto(`${base}/demo`, { waitUntil: 'networkidle' })
    await page.goto(`${base}/demo/dashboard/inventory`, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'New category' }).waitFor({ timeout: 60_000 })
  },

  steps: [
    {
      say: "In this video, you'll create a category and decide how Storvv tracks the stock inside it.",
      run: async ({ page, hover }) =>
        hover(page.getByRole('heading', { name: /Categories/ }).first()),
    },
    {
      say: 'Categories group your products, like Phones or Accessories. A category can also hold subcategories, like Phones, then Smartphones.',
      run: async ({ page, hover, wait }) => {
        await hover(page.getByRole('button', { name: 'Accessories', exact: true }))
        await wait(1200)
        await hover(page.getByRole('button', { name: 'Phones', exact: true }))
        await wait(1500)
        await hover(page.getByRole('listitem', { name: '1 subcategory' }))
      },
    },
    {
      say: "Let's add laptops. Click New category. The form walks you through it, one numbered step at a time.",
      run: async ({ page, click }) => click(page.getByRole('button', { name: 'New category' })),
    },
    {
      say: 'Step one: name the category. Use the name your staff already use.',
      run: async ({ page, type }) =>
        type(drawer(page).getByRole('textbox', { name: 'Category name' }), 'Laptops'),
    },
    {
      say: "When a step is done, its number turns into a tick, so you always know what's left.",
      run: async ({ page, hover }) =>
        hover(drawer(page).getByRole('heading', { name: 'Name the category' })),
    },
    {
      say: 'Step two: choose what it sells. This sets the icon on the category. Storvv suggests one from the name, and Computers and laptops is right.',
      run: async ({ page, hover, click, wait }) => {
        await hover(drawer(page).getByRole('heading', { name: 'Choose what it sells' }))
        await wait(1500)
        await click(drawer(page).getByRole('radio', { name: 'Computers & laptops' }))
      },
    },
    {
      say: 'Step three is how you track stock. Every laptop has its own serial number, so tick Use serial numbers. Each unit then gets its own row.',
      run: async ({ page, click, wait }) => {
        await wait(1800)
        await click(drawer(page).getByText('Use serial numbers', { exact: true }))
      },
    },
    {
      say: 'For things like chargers, leave it off, and Storvv just counts the quantity.',
      run: async ({ page, hover }) =>
        hover(drawer(page).getByText(/Off: you just track a quantity/)),
    },
    {
      say: 'Track profit adds a cost price column, so Storvv can show your profit. Tick it.',
      run: async ({ page, hover, click, wait }) => {
        await hover(drawer(page).getByText('Track profit', { exact: true }))
        await wait(1800)
        await click(drawer(page).getByText('Track profit', { exact: true }))
      },
    },
    {
      say: 'Step four is optional. Leave it, and every department can see this category.',
      run: async ({ page, hover }) =>
        hover(drawer(page).getByRole('heading', { name: /Choose who can see it/ })),
    },
    {
      say: 'Step five: the columns. These are the details you fill in for each laptop. Storvv has already added Serial Number and Product model for you.',
      run: async ({ page, hover, wait }) => {
        await hover(drawer(page).getByRole('heading', { name: 'Set up the product columns' }))
        await wait(2500)
        await settle(drawer(page).getByRole('textbox', { name: 'Column 4 label' }))
        await hover(drawer(page).getByRole('textbox', { name: 'Column 3 label' }))
        await wait(700)
        await hover(drawer(page).getByRole('textbox', { name: 'Column 4 label' }))
      },
    },
    {
      say: 'To add your own, click Add column and type its name. Here, Brand.',
      run: async ({ page, click, type }) => {
        await click(drawer(page).getByRole('button', { name: 'Add column' }))
        await type(drawer(page).getByRole('textbox', { name: 'Column 1 label' }), 'Brand')
      },
    },
    {
      say: 'Tick Unique only when no two products can share a value, like an IMEI number. Many laptops share a brand, so leave it off here.',
      run: async ({ page, hover }) =>
        hover(
          drawer(page)
            .locator('label')
            .filter({ hasText: /^\s*Unique\s*$/ })
            .first()
        ),
    },
    {
      say: 'Check the line above the buttons. Laptops will be created with six columns.',
      run: async ({ page, hover }) =>
        hover(drawer(page).getByRole('contentinfo').getByRole('paragraph')),
    },
    {
      say: 'Click Create category. Laptops is ready.',
      run: async ({ page, click, hover }) => {
        await click(drawer(page).getByRole('button', { name: 'Create category' }))
        await drawer(page).waitFor({ state: 'hidden' })
        await hover(page.getByRole('heading', { name: 'Laptops', exact: true }))
      },
    },
    {
      say: 'One more thing. In Settings, under Inventory, Low stock alert sets when Storvv warns you that something is running low.',
      run: async ({ page, click, hover }) => {
        await click(sideMenu(page).getByRole('link', { name: 'Settings' }))
        await click(page.getByRole('tab', { name: 'Inventory' }))
        await hover(page.getByLabel('Low stock alert'))
      },
    },
    {
      say: 'Recap: name it, choose what it sells, pick serial numbers or quantity, then set the columns. Next, add your products.',
      run: async ({ page, click }) => {
        await click(sideMenu(page).getByRole('link', { name: 'Inventory' }))
        await page.getByRole('heading', { name: 'Laptops', exact: true }).waitFor()
      },
    },
  ],
}

/** The New category drawer. */
function drawer(page) {
  return page.getByRole('dialog', { name: 'Create new category' })
}

/** Scroll an element into view and let the drawer's smooth scroll finish before pointing. */
async function settle(locator) {
  await locator.scrollIntoViewIfNeeded()
  await new Promise((resolve) => setTimeout(resolve, 700))
}

/** The left-hand menu. */
function sideMenu(page) {
  return page.getByRole('complementary', { name: 'Main navigation' })
}
