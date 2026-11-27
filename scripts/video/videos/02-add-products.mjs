/**
 * Video 2 · Add your products (storyboard in the "Storvv video series" doc).
 * Each step: `say` is the narration; `run` is what happens on screen while it plays.
 *
 * The demo doesn't keep a new category's serial-number setting (every demo category counts a
 * quantity), so the serial-number drawer can't be filmed here. This video adds stock to
 * Accessories instead: one product by hand, then a spreadsheet import.
 */
import * as XLSX from 'xlsx'

export default {
  id: '02-add-products',
  title: 'Add your products',

  /** Not recorded: a fresh demo with video 1's Laptops category, on the Inventory page. */
  async setup({ page }, base) {
    await page.goto(`${base}/demo`, { waitUntil: 'networkidle' })
    await page.goto(`${base}/demo/dashboard/inventory`, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'New category' }).click()
    const drawer = page.getByRole('dialog', { name: 'Create new category' })
    await drawer.getByRole('textbox', { name: 'Category name' }).fill('Laptops')
    await drawer.getByRole('radio', { name: 'Computers & laptops' }).click()
    await drawer.getByText('Use serial numbers', { exact: true }).click()
    await drawer.getByText('Track profit', { exact: true }).click()
    await drawer.getByRole('button', { name: 'Add column' }).click()
    await drawer.getByRole('textbox', { name: 'Column 1 label' }).fill('Brand')
    await drawer.getByRole('button', { name: 'Create category' }).click()
    await drawer.waitFor({ state: 'hidden' })
    await page.getByRole('button', { name: 'Laptops', exact: true }).waitFor()
  },

  steps: [
    {
      say: "In this video, you'll put stock into a category: one product at a time, a whole spreadsheet at once, and changes to many products together.",
      run: async ({ page, hover }) =>
        hover(page.getByRole('heading', { name: /Categories/ }).first()),
    },
    {
      say: 'First, open the category. Here, Accessories.',
      run: async ({ page, click }) => {
        await click(page.getByRole('button', { name: 'Accessories', exact: true }))
        await page.getByRole('heading', { name: 'Accessories', level: 2 }).waitFor()
      },
    },
    {
      say: 'Click Add product.',
      run: async ({ page, click }) =>
        click(page.getByRole('button', { name: 'Add product' }).first()),
    },
    {
      say: 'Type the product name, then its price.',
      run: async (act) => {
        const form = addDrawer(act.page)
        await act.type(form.getByRole('textbox', { name: 'Product name' }), 'Power bank 10000mAh')
        await retype(act, form.getByRole('spinbutton', { name: 'Price' }), '15000')
      },
    },
    {
      say: 'Then, how many you have in stock.',
      run: async (act) =>
        retype(
          act,
          addDrawer(act.page).getByRole('spinbutton', { name: 'Quantity in stock' }),
          '12'
        ),
    },
    {
      say: 'Add a SKU too, if you use them. It helps you find the product fast when you search.',
      run: async ({ page, type }) =>
        type(addDrawer(page).getByRole('textbox', { name: 'SKU' }), 'ACC-PWR'),
    },
    {
      say: 'Click Add product. It joins the list, ready to sell.',
      run: async ({ page, click, hover }) => {
        await click(addDrawer(page).getByRole('button', { name: 'Add product' }))
        await addDrawer(page).waitFor({ state: 'hidden' })
        await hover(page.getByRole('cell', { name: /Power Bank/i }).first())
      },
    },
    {
      say: 'Availability shows if each product is available, sold, on a stock loan, awaiting payment or returned.',
      run: async ({ page, hover, wait }) => {
        await hover(page.getByRole('columnheader', { name: 'Availability' }))
        await wait(1500)
        await hover(rowOf(page, /Power Bank/i).getByRole('cell', { name: 'Available' }))
        await wait(1200)
        await hover(rowOf(page, 'Silicone phone case').getByRole('cell', { name: 'Returned' }))
      },
    },
    {
      say: 'Got a stock list already? Click Import and choose your Excel file. Use the same column names you see in the table.',
      run: async ({ page, click, wait }) => {
        await wait(1200)
        const [chooser] = await Promise.all([
          page.waitForEvent('filechooser'),
          click(page.getByRole('button', { name: 'Import' }).first()),
        ])
        await wait(1200)
        await chooser.setFiles({
          name: 'accessories.xlsx',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          buffer: stockList(),
        })
      },
    },
    {
      say: 'Storvv adds each row as a product, and tells you how many it imported.',
      run: async ({ page, hover, wait }) => {
        await hover(page.getByText(/Successfully imported/).first())
        await wait(1500)
        await hover(page.getByRole('cell', { name: /Bluetooth Earbuds/i }).first())
      },
    },
    {
      say: 'Export does the reverse, and downloads this category as a spreadsheet.',
      run: async ({ page, click }) => click(page.getByRole('button', { name: 'Export' }).first()),
    },
    {
      say: 'Tick products to act on several at once. For example, change their prices together with Price.',
      run: async ({ page, click, hover }) => {
        await click(page.getByRole('cell', { name: /^Select Bluetooth Earbuds$/i }))
        await click(page.getByRole('cell', { name: /^Select Car Charger$/i }))
        await hover(
          page
            .getByRole('region', { name: 'Bulk actions' })
            .getByText(/selected/)
            .first()
        )
        await hover(
          page.getByRole('region', { name: 'Bulk actions' }).getByRole('button', { name: 'Price' })
        )
      },
    },
    {
      say: 'Recap: add one product with its quantity, import a whole spreadsheet, and tick several to change them together. Next, sell fast with Quick sale.',
      run: async ({ page, click }) =>
        click(
          page.getByRole('region', { name: 'Bulk actions' }).getByRole('button', { name: 'Clear' })
        ),
    },
  ],
}

/** The Add product drawer. */
function addDrawer(page) {
  return page.getByRole('dialog', { name: 'Add product' })
}

/** The table row for a product. */
function rowOf(page, name) {
  return page.getByRole('row').filter({ has: page.getByRole('cell', { name, exact: true }) })
}

/** Replace a field's value (number fields start at 0), typing it so viewers see it. */
async function retype({ click }, locator, text) {
  await click(locator)
  await locator.press('ControlOrMeta+a')
  await locator.pressSequentially(text, { delay: 75 })
  await new Promise((resolve) => setTimeout(resolve, 300))
}

/** A small stock list matching the Accessories columns, made on the fly. */
function stockList() {
  const sheet = XLSX.utils.aoa_to_sheet([
    ['Product name', 'Price', 'Quantity in stock', 'SKU'],
    ['Screen protector', 3500, 40, 'ACC-SCR'],
    ['Bluetooth earbuds', 22000, 8, 'ACC-EAR'],
    ['Car charger', 6500, 15, 'ACC-CAR'],
  ])
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, 'Stock')
  return XLSX.write(book, { type: 'buffer', bookType: 'xlsx' })
}
