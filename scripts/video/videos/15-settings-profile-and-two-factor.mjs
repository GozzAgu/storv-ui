/**
 * Video 15 · Settings, your profile and two-factor sign-in (storyboard in the "Storvv video
 * series" doc). Each step: `say` is the narration; `run` is what happens on screen while it plays.
 *
 * Two-factor is only started, to show the QR code, then cancelled: nothing is turned on.
 */
export default {
  id: '15-settings-profile-and-two-factor',
  title: 'Settings, your profile and two-factor sign-in',

  /** Not recorded: a fresh demo on the Overview. */
  async setup({ page }, base) {
    await page.goto(`${base}/demo`, { waitUntil: 'networkidle' })
    await page.goto(`${base}/demo/dashboard`, { waitUntil: 'networkidle' })
    await page.getByRole('link', { name: 'Settings' }).waitFor({ timeout: 60_000 })
  },

  steps: [
    {
      say: "In this last video, you'll set up your store's details, and keep your account safe.",
      run: async ({ page, click }) => click(page.getByRole('link', { name: 'Settings' })),
    },
    {
      say: 'Settings is organised in tabs.',
      run: async ({ page, hover, wait }) => {
        const tabs = page.getByRole('tablist', { name: 'Settings sections' }).getByRole('tab')
        for (let i = 0; i < 6; i++) {
          await hover(tabs.nth(i))
          await wait(150)
        }
      },
    },
    {
      say: 'Account and workspace has your company logo, your plan and when it renews, and your workspace style: Just me, or Growing business.',
      run: async ({ page, click, hover, wait }) => {
        await click(tab(page, 'Account & workspace'))
        await hover(main(page).getByText('Company logo', { exact: true }).first())
        await wait(1200)
        await hover(main(page).getByText('Storvv Enterprise', { exact: true }).first())
        await wait(1200)
        await hover(page.getByRole('radiogroup', { name: 'Workspace style' }))
      },
    },
    {
      say: 'Store information holds the business details shown on your receipts. Click Edit to fill them in.',
      run: async ({ page, click, hover }) => {
        await click(tab(page, 'Store information'))
        await hover(main(page).getByRole('button', { name: 'Edit', exact: true }))
      },
    },
    {
      say: 'Inventory sets when Storvv warns you that stock is running low.',
      run: async ({ page, click, hover }) => {
        await click(tab(page, 'Inventory'))
        await hover(page.getByRole('spinbutton', { name: 'Low stock alert' }))
      },
    },
    {
      say: "Checkout payments lists the ways customers can pay you. Remove the ones you don't take, add your own, then save.",
      run: async ({ page, click, hover, wait }) => {
        await click(tab(page, 'Checkout payments'))
        await hover(page.getByRole('button', { name: 'Remove Cash' }))
        await wait(1500)
        await hover(page.getByRole('textbox', { name: 'Add a method' }))
        await wait(1200)
        await hover(page.getByRole('button', { name: 'Save payment methods' }))
      },
    },
    {
      say: 'Sales and receipts controls what happens after a sale, like printing the receipt automatically.',
      run: async ({ page, click, hover }) => {
        await click(tab(page, 'Sales & receipts'))
        await hover(page.getByRole('switch', { name: /Print receipts automatically/ }))
      },
    },
    {
      say: "Data export downloads all your store's data to Excel, whenever you want it. It's yours.",
      run: async ({ page, click, hover }) => {
        await click(tab(page, 'Data export'))
        await hover(page.getByRole('button', { name: 'Export all to Excel' }))
      },
    },
    {
      say: 'Now your own profile. Click your picture at the top, and choose Profile.',
      run: async ({ page, click, wait }) => {
        await click(page.getByRole('button', { name: /Account menu/ }))
        await wait(500)
        await click(page.getByRole('menuitem', { name: 'Profile' }))
      },
    },
    {
      say: 'Here you add your photo, update your business details, and change your language, currency and timezone.',
      run: async ({ page, hover, wait }) => {
        await hover(page.getByRole('button', { name: 'Add photo' }))
        await wait(1000)
        await hover(main(page).getByRole('button', { name: 'Edit', exact: true }).first())
        await wait(1000)
        await hover(page.getByRole('button', { name: /^Language/ }))
        await wait(800)
        await hover(page.getByRole('button', { name: /^Currency/ }))
      },
    },
    {
      say: 'Notifications sets how Storvv lets you know about activity.',
      run: async ({ page, hover }) =>
        hover(page.getByRole('button', { name: /^Notification channels/ })),
    },
    {
      say: 'Under Security, change your password, see the devices signed in, and turn on two-factor authentication.',
      run: async ({ page, hover, wait }) => {
        await hover(page.getByRole('button', { name: /^Password/ }))
        await wait(1200)
        await hover(page.getByRole('button', { name: /^Active sessions/ }))
        await wait(1200)
        await hover(page.getByRole('button', { name: /^Two-factor authentication/ }))
      },
    },
    {
      say: 'Click Enable, choose Authenticator app, and click Continue.',
      run: async ({ page, click }) => {
        await click(page.getByRole('button', { name: /^Two-factor authentication/ }))
        await click(twoFactor(page).getByRole('radio', { name: /Authenticator app/ }))
        await click(twoFactor(page).getByRole('button', { name: 'Continue' }))
      },
    },
    {
      say: "Scan the code with an authenticator app on your phone, then follow the steps. With two-factor on, signing in needs a code from your phone as well as your password. Owners should always turn it on. We'll cancel here.",
      run: async ({ page, hover, click, wait }) => {
        await hover(twoFactor(page).getByRole('img', { name: '2FA QR code' }))
        await wait(9000)
        await click(twoFactor(page).getByRole('button', { name: 'Cancel' }))
      },
    },
    {
      say: "That's the series. If you get stuck, tap Help in the side menu, or chat with us on WhatsApp.",
      run: async ({ page, click, hover }) => {
        await click(page.getByRole('link', { name: 'Overview' }))
        await hover(page.getByRole('link', { name: 'Help' }))
      },
    },
  ],
}

function main(page) {
  return page.getByRole('main')
}

function tab(page, name) {
  return page.getByRole('tab', { name })
}

/** The two-factor setup dialog. */
function twoFactor(page) {
  return page.getByRole('dialog', { name: 'Set up two-factor authentication' })
}
