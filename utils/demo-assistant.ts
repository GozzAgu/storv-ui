import { sanitizeAssistantReply } from '~/utils/assistant-chat'

type DemoAssistantRule = {
  keywords: string[]
  reply: string
}

const DEMO_ASSISTANT_RULES: DemoAssistantRule[] = [
  {
    keywords: ['buyback', 'trade-in', 'trade in', 'swap-in', 'swap in'],
    reply: [
      'Customer buybacks let super admins record trade-ins from customers.',
      '',
      '- Open Inventory → Customer buybacks (or /dashboard/buybacks).',
      '- Pick a leaf category, enter item details, amount paid, and payment method.',
      '- The paid amount becomes unit cost on the new inventory row.',
      '- Use swap-in credit on Create New Sale when trade-in value applies to a purchase.',
      '',
      'In this demo, sample buybacks are shown with dummy amounts only.',
    ].join('\n'),
  },
  {
    keywords: ['analytics', 'feature insight', 'report', 'export', 'chart'],
    reply: [
      'Analytics & Reports (Medium and Enterprise) includes charts plus Feature insights cards.',
      '',
      '- Pick Daily, Weekly, or Monthly at the top.',
      '- Review period summary, inventory health, and insight cards for sales, returns, outstanding balances, customers, profit, buybacks, loans, and payment links.',
      '- Export PDF or Excel from the header.',
      '',
      'Demo data is seeded locally; numbers are illustrative, not live.',
    ].join('\n'),
  },
  {
    keywords: ['quick sale', 'quicksale', 'barcode', 'scan'],
    reply: [
      'Quick Sale opens as a side drawer from the Sales page.',
      '',
      '- Pick parent category, then subcategory when needed.',
      '- Scan barcodes or search products; stock limits block over-quantity lines.',
      '- Sell screen notes from branch settings appear after you pick a category.',
    ].join('\n'),
  },
  {
    keywords: ['subcategor', 'subfolder', 'parent categor', 'leaf', 'organize with'],
    reply: [
      'Inventory uses one level of subcategories under a parent category.',
      '',
      '- When creating a category, turn on Organize with subcategories only if you want a parent hub (for example Toyota → Corolla, Camry). Leave it off to add products directly in that category.',
      '- Products live only in leaf categories (subcategories or flat top-level categories).',
      '- Open a parent from /dashboard/inventory to see its subcategory hub and Add subcategory.',
      '- Create New Sale and Quick Sale follow parent → subcategory → items when the parent uses subcategories.',
    ].join('\n'),
  },
  {
    keywords: ['copy from branch', 'copy branch', 'copy categor', 'copy folder', 'copy template'],
    reply: [
      'Copy from branch (Enterprise) copies category templates between branches.',
      '',
      '- Open Inventory → Copy from branch when you have two or more branches.',
      '- Pick a source branch and select top-level categories to copy into the branch you are viewing.',
      '- Check Also copy subcategories into selected folders to include the full hierarchy (for example Toyota plus its model subcategories).',
      '- Products and stock are not copied—only names, columns, and category settings.',
    ].join('\n'),
  },
  {
    keywords: [
      'create branch',
      'create a branch',
      'new branch',
      'add branch',
      'branch name',
      'branch city',
      'region city',
    ],
    reply: [
      'Create branches in Settings → Branches (super admin only).',
      '',
      '- Branch name uses a city dropdown from your account region (country from onboarding).',
      '- Optionally add an area or neighborhood (for example Lekki under Lagos).',
      '- Sell screen notes and contact fields are optional on the same form.',
      '- Branch limits depend on your plan (Micro: one store; higher plans allow more).',
    ].join('\n'),
  },
  {
    keywords: ['stock loan', 'seller loan', 'borrower', 'lend'],
    reply: [
      'Stock loans (Enterprise) track serialized inventory lent to borrowers.',
      '',
      '- Open Inventory → Stock loans.',
      '- Filter Active, Returned, Sold (borrower), or All.',
      '- Mark sold or returned from row actions when the borrower finishes.',
      '',
      'This demo includes dummy active and returned loans for Lagos.',
    ].join('\n'),
  },
  {
    keywords: ['payment link', 'paystack', 'payout'],
    reply: [
      'Payment links create shareable checkout URLs for remote sales.',
      '',
      '- Open Payment links from the sidebar when your plan includes them.',
      '- Connect a payout account, then create links with customer name and amount.',
      '- Dashboard and Analytics show a payment links summary card.',
      '',
      'Demo links are stored locally with sample paid and unpaid statuses.',
    ].join('\n'),
  },
  {
    keywords: ['balance', 'credit', 'ledger', 'outstanding', 'owe'],
    reply: [
      'Customer balance (Medium+) tracks credit and amounts owed on the Sales → Customers tab.',
      '',
      '- Balance-due sales add to the customer ledger.',
      '- Outstanding balances also appear on Analytics feature insights.',
      '',
      'Demo includes a sample customer with an open balance and a balance-due receipt.',
    ].join('\n'),
  },
  {
    keywords: ['assistant', 'help', 'guide', 'storvv assistant'],
    reply: [
      'You are using Storvv Assistant in demo mode with canned guidance (no live AI or store data).',
      '',
      '- Ask about sales, inventory subcategories, copy from branch, branch setup, buybacks, analytics, stock loans, or payment links.',
      '- Open Help center from the sidebar for the full searchable guide.',
      '- Sign up for a real account to use Gemini-powered assistant on your hosted workspace.',
    ].join('\n'),
  },
  {
    keywords: ['create a sale', 'create sale', 'new sale', 'receipt', 'ring up'],
    reply: [
      'To create a sale, open Sales and choose New sale or Quick Sale.',
      '',
      'Create New Sale (four steps):',
      '- Step 1: parent category',
      '- Step 2: subcategory when the parent has children',
      '- Step 3: items and quantities',
      '- Step 4: customer, payment method, and notes',
      '',
      'Managers can edit receipts; only super admins can delete them.',
    ].join('\n'),
  },
  {
    keywords: ['plan', 'subscription', 'micro', 'medium', 'enterprise', 'upgrade'],
    reply: [
      'Storvv plans (Settings → subscription):',
      '',
      '- Micro: one store, core sales and inventory, capped WhatsApp.',
      '- Medium: Analytics, Activity logs, customer balance, second store.',
      '- Enterprise: Multi-store sync, copy from branch, stock loans, unlimited stores.',
      '',
      'This demo runs as Enterprise super admin so you can explore all areas.',
    ].join('\n'),
  },
]

const DEMO_ASSISTANT_DEFAULT = [
  'I can explain Storvv workflows in this demo using sample guidance (not live AI).',
  '',
  'Try asking about:',
  '- Organize with subcategories (optional)',
  '- Copy from branch with subcategories',
  '- Create branch with region cities',
  '- Customer buybacks',
  '- Analytics feature insights',
  '- Quick Sale or Create New Sale',
  '- Stock loans or payment links',
  '',
  'Open Help center from the sidebar for the full guide.',
].join('\n')

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim()
}

export function generateDemoAssistantReply(userMessage: string): string {
  const normalized = normalize(userMessage)
  for (const rule of DEMO_ASSISTANT_RULES) {
    if (rule.keywords.some((kw) => normalized.includes(kw))) {
      return sanitizeAssistantReply(rule.reply)
    }
  }
  return sanitizeAssistantReply(DEMO_ASSISTANT_DEFAULT)
}
