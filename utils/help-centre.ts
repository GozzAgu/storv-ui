import type { Component } from 'vue'
import { Boxes, Building2, ChartColumn, CreditCard, ReceiptText, Rocket, Users } from '@lucide/vue'

export interface HelpAnswer {
  id: string
  q: string
  a: string
  link?: { label: string; to: string }
}

export interface HelpTopic {
  id: string
  icon: Component
  title: string
  /** One line, at most 12 words. */
  line: string
  answers: HelpAnswer[]
}

/**
 * Public help centre. Short answers in plain English, and only what the product does today:
 * check a claim in the code before adding it here.
 */
export const HELP_TOPICS: HelpTopic[] = [
  {
    id: 'getting-started',
    icon: Rocket,
    title: 'Getting started',
    line: 'Sign up, try the demo and set up your shop.',
    answers: [
      {
        id: 'install',
        q: 'Do I need to install anything?',
        a: 'No. Storvv runs in your browser at app.storvv.com. Sign up and start adding stock.',
      },
      {
        id: 'free',
        q: 'Is Storvv really free?',
        a: 'Yes. The Micro plan is free forever for one store and two staff. No card needed.',
      },
      {
        id: 'demo',
        q: 'Can I try it without signing up?',
        a: 'Yes. The demo is a sample shop you can click around freely.',
        link: { label: 'Open the demo', to: '/demo/dashboard' },
      },
      {
        id: 'phone',
        q: 'Can I use it on my phone?',
        a: 'Yes. Open app.storvv.com in your phone’s browser and sign in.',
      },
      {
        id: 'who',
        q: 'What kind of shops is it for?',
        a: 'Phones and gadgets, cars and car parts, electronics, fashion, supermarkets, beauty and furniture.',
      },
    ],
  },
  {
    id: 'inventory',
    icon: Boxes,
    title: 'Inventory',
    line: 'Categories, custom fields, serials and low stock.',
    answers: [
      {
        id: 'organise',
        q: 'How do I organise my stock?',
        a: 'Create categories, and subcategories inside them when you need them, like Toyota then Corolla.',
      },
      {
        id: 'fields',
        q: 'Can I track IMEI, engine numbers or sizes?',
        a: 'Yes. Add your own fields to a category, such as IMEI, engine number, colour or size.',
      },
      {
        id: 'serial',
        q: 'Should I track by serial or by quantity?',
        a: 'Use serials for phones and cars you sell one by one. Use quantity for things like cables.',
      },
      {
        id: 'unique',
        q: 'Can I stop the same serial being entered twice?',
        a: 'Yes. Mark a field unique and Storvv will not let two products share it.',
      },
      {
        id: 'low-stock',
        q: 'Will I know when stock runs low?',
        a: 'Yes. Storvv flags low stock, and you can export a reorder list.',
      },
      {
        id: 'barcode',
        q: 'Can I scan barcodes?',
        a: 'Yes. Quick Sale scans barcodes with your camera or a barcode scanner.',
      },
      {
        id: 'import',
        q: 'Can I bring in my existing stock list?',
        a: 'Yes. Import products from an Excel file into any category.',
      },
    ],
  },
  {
    id: 'sales',
    icon: ReceiptText,
    title: 'Sales',
    line: 'Checkout, receipts, part payments, returns and trade ins.',
    answers: [
      {
        id: 'sell',
        q: 'How do I make a sale?',
        a: 'Use Quick Sale for a fast checkout, or New sale when you want customer details too.',
      },
      {
        id: 'receipt',
        q: 'How can I send a receipt?',
        a: 'Print it, save it as a PDF, send it on WhatsApp, or share it as a link.',
      },
      {
        id: 'split',
        q: 'Can a customer pay with more than one method?',
        a: 'Yes. Split one sale across cash, transfer, card and the other methods you use.',
      },
      {
        id: 'part-pay',
        q: 'Can a customer pay in parts?',
        a: 'Yes. Record what they pay now and Storvv keeps track of the balance.',
      },
      {
        id: 'returns',
        q: 'How do returns work?',
        a: 'Refund the sale from its menu and the items go back into stock.',
      },
      {
        id: 'trade-ins',
        q: 'Can I take trade ins?',
        a: 'Yes. The store owner records the trade in and the item joins your stock.',
      },
    ],
  },
  {
    id: 'customers',
    icon: Users,
    title: 'Customers',
    line: 'History, balances, reminders and sales leads.',
    answers: [
      {
        id: 'history',
        q: 'Where do I see what a customer bought?',
        a: 'Every customer has their own page with their purchase history.',
      },
      {
        id: 'balances',
        q: 'How do I keep track of who owes me?',
        a: 'The credit ledger shows every balance and payment. It comes with Medium and Enterprise.',
      },
      {
        id: 'reminders',
        q: 'Can I remind customers to pay?',
        a: 'Yes. Send a payment reminder to the customer on WhatsApp.',
      },
      {
        id: 'leads',
        q: 'What are sales leads?',
        a: 'Enquiries you log before someone buys, then turn into a sale. Medium and Enterprise.',
      },
    ],
  },
  {
    id: 'reports',
    icon: ChartColumn,
    title: 'Reports',
    line: 'What sells, who buys and when you are busiest.',
    answers: [
      {
        id: 'reports',
        q: 'What can I see in Reports?',
        a: 'Revenue, top products, best customers, payment methods and your busiest hours.',
      },
      {
        id: 'plan',
        q: 'Which plans include Reports?',
        a: 'Medium and Enterprise. Every plan gets the live overview.',
      },
      {
        id: 'export',
        q: 'Can I export my numbers?',
        a: 'Yes. Download your reports as PDF or Excel.',
      },
      {
        id: 'search',
        q: 'How do I find something quickly?',
        a: 'Use search to find any sale, product or customer in seconds.',
      },
    ],
  },
  {
    id: 'team',
    icon: Building2,
    title: 'Team and branches',
    line: 'Staff logins, profit visibility, branches and transfers.',
    answers: [
      {
        id: 'logins',
        q: 'Can my staff have their own logins?',
        a: 'Yes. Each person signs in with their own account, and you choose what they can do.',
      },
      {
        id: 'profit',
        q: 'Can my staff see profit?',
        a: 'Only if you allow it. Money figures stay hidden until you turn on Financial figures for them.',
      },
      {
        id: 'branches',
        q: 'Can I manage more than one branch?',
        a: 'Yes. Medium covers 2 stores and Enterprise covers 5, all in one account.',
      },
      {
        id: 'transfers',
        q: 'How do stock transfers work?',
        a: 'Move stock from one branch to another, with approval. Transfers come with Enterprise.',
      },
      {
        id: 'activity',
        q: 'Can I see who changed what?',
        a: 'Yes. The activity log records changes. It comes with Medium and Enterprise.',
      },
      {
        id: 'two-step',
        q: 'How do I keep my account safe?',
        a: 'Turn on two step sign in from your profile. It works for owners and staff.',
      },
    ],
  },
  {
    id: 'billing',
    icon: CreditCard,
    title: 'Plans and billing',
    line: 'Prices, discounts, add ons and cancelling.',
    answers: [
      {
        id: 'prices',
        q: 'What does each plan cost?',
        a: 'Micro is free. Medium is ₦15,000 a month. Enterprise is ₦25,000 a month.',
        link: { label: 'Compare every plan', to: '/pricing' },
      },
      {
        id: 'discounts',
        q: 'Do you offer discounts?',
        a: 'Yes. Save 10% when you pay quarterly, or 15% when you pay yearly.',
      },
      {
        id: 'add-ons',
        q: 'Can I add more stores or staff?',
        a: 'Yes, on Enterprise. An extra store is ₦5,000 a month and an extra staff seat ₦2,000.',
      },
      {
        id: 'cancel',
        q: 'Can I cancel any time?',
        a: 'Yes, from Settings. Nothing is deleted when you move to a smaller plan.',
      },
      {
        id: 'export-data',
        q: 'Can I download my data?',
        a: 'Yes. Owners can export everything to Excel from Settings at any time.',
      },
    ],
  },
]

/** Answers matching every word of the query, by topic. Topics with no match are dropped. */
export function searchHelp(query: string, topics: HelpTopic[] = HELP_TOPICS): HelpTopic[] {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return topics
  return topics
    .map((topic) => ({
      ...topic,
      answers: topic.answers.filter((answer) => {
        const text = `${answer.q} ${answer.a} ${topic.title}`.toLowerCase()
        return words.every((word) => text.includes(word))
      }),
    }))
    .filter((topic) => topic.answers.length > 0)
}
