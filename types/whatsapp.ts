export type WhatsAppMessageKind = 'receipt' | 'payment_reminder'

export interface WhatsAppTemplate {
 id: string
 label: string
 body: string
}

export const WHATSAPP_RECEIPT_TEMPLATES: WhatsAppTemplate[] = [
 {
 id: 'receipt_standard',
 label: 'Receipt summary',
 body: `Hi {{customerName}},

Thank you for shopping at {{storeName}}.

Receipt #{{receiptNumber}}
Date: {{receiptDate}}
Total: {{total}}

View your receipt: {{receiptLink}}

{{storeName}}`,
 },
 {
 id: 'receipt_short',
 label: 'Short receipt',
 body: `Hi {{customerName}}, your receipt #{{receiptNumber}} from {{storeName}} is ready ({{total}}).

{{receiptLink}}`,
 },
]

export const WHATSAPP_PAYMENT_REMINDER_TEMPLATES: WhatsAppTemplate[] = [
 {
 id: 'reminder_friendly',
 label: 'Friendly reminder',
 body: `Hi {{customerName}},

This is a friendly reminder from {{storeName}} that you have an outstanding balance of {{balanceDue}}.

Please let us know when you can settle. Thank you!`,
 },
 {
 id: 'reminder_due',
 label: 'Balance due',
 body: `Hi {{customerName}},

Your account at {{storeName}} shows a balance due of {{balanceDue}}.

Please arrange payment at your earliest convenience.`,
 },
 {
 id: 'reminder_urgent',
 label: 'Urgent follow-up',
 body: `Hi {{customerName}},

We need to follow up on your outstanding balance of {{balanceDue}} at {{storeName}}.

Please reply or visit us to settle this week.`,
 },
]

export interface WhatsAppTemplateVars {
 customerName?: string
 storeName?: string
 receiptNumber?: string
 receiptDate?: string
 total?: string
 balanceDue?: string
 receiptLink?: string
}

export function interpolateWhatsAppTemplate(template: string, vars: WhatsAppTemplateVars): string {
 return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
 const v = vars[key as keyof WhatsAppTemplateVars]
 return v != null && v !== '' ? String(v) : ''
 })
}
