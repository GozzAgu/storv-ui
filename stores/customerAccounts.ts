import { defineStore } from 'pinia'
import { CLOUD_UNAVAILABLE_MESSAGE } from '~/utils/cloud-user-messages'
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore'
import { useFirestore } from '~/composables/useFirestore'
import { useAuthStore } from './auth'
import { useUserStore } from './user'
import {
  getCustomerAccountsCollection,
  getCustomerAccountDocument,
  getQueryUserId,
} from '~/composables/useFirestorePaths'
import { getCurrentStoreId } from '~/composables/useCurrentStore'
import { customerAccountDocId, getCustomerContactKey } from '~/utils/customer-key'

export type BalanceLedgerEntryType = 'charge' | 'payment' | 'adjustment' | 'receipt'

export interface BalanceLedgerEntry {
  id: string
  type: BalanceLedgerEntryType
  /** Positive increases amount owed; negative reduces balance. */
  amount: number
  note?: string
  receiptId?: string
  createdAt: Date
  createdBy: string
}

export interface CustomerAccount {
  id: string
  contactKey: string
  customerName: string
  email?: string
  phone?: string
  /** Amount the customer owes the store (≥ 0). */
  accountBalance: number
  balanceLedger: BalanceLedgerEntry[]
  storeId: string
  updatedAt?: Date
}

const MAX_LEDGER_ENTRIES = 50

/** Build illustrative balance accounts from the demo customers so the ledger is never empty. */
async function buildDemoCustomerAccounts(): Promise<Record<string, CustomerAccount>> {
  const { useDemoAppStore } = await import('~/stores/demoApp')
  const { DEMO_USER_UID } = await import('~/utils/demo-mode')
  const demo = useDemoAppStore()
  demo.hydrate()
  const storeId = demo.state.currentStoreId
  const customers = demo.currentStore.customers
  const map: Record<string, CustomerAccount> = {}

  // Give the first named customer an outstanding balance with a short ledger trail.
  const withBalance = customers.find((c) => c.name && c.name !== 'Walk-in customer')
  if (withBalance) {
    const contactKey = getCustomerContactKey({
      name: withBalance.name,
      phone: withBalance.phone,
    })
    const now = Date.now()
    const day = 24 * 60 * 60 * 1000
    map[contactKey] = {
      id: customerAccountDocId(contactKey),
      contactKey,
      customerName: withBalance.name,
      phone: withBalance.phone,
      accountBalance: 120000,
      balanceLedger: [
        {
          id: 'demo_le_1',
          type: 'payment',
          amount: -80000,
          note: 'Part-payment received',
          createdAt: new Date(now - day),
          createdBy: DEMO_USER_UID,
        },
        {
          id: 'demo_le_2',
          type: 'charge',
          amount: 200000,
          note: 'Balance-due sale',
          createdAt: new Date(now - day * 4),
          createdBy: DEMO_USER_UID,
        },
      ],
      storeId,
      updatedAt: new Date(now - day),
    }
  }
  return map
}

function parseLedgerEntry(raw: Record<string, unknown>, id: string): BalanceLedgerEntry {
  const createdAt = raw.createdAt as { toDate?: () => Date } | Date | string | undefined
  let created: Date
  if (
    createdAt &&
    typeof createdAt === 'object' &&
    'toDate' in createdAt &&
    typeof createdAt.toDate === 'function'
  ) {
    created = createdAt.toDate()
  } else if (createdAt instanceof Date) {
    created = createdAt
  } else {
    created = new Date(createdAt as string)
  }
  return {
    id: (raw.id as string) || id,
    type: (raw.type as BalanceLedgerEntryType) || 'adjustment',
    amount: Number(raw.amount) || 0,
    note: raw.note as string | undefined,
    receiptId: raw.receiptId as string | undefined,
    createdAt: created,
    createdBy: (raw.createdBy as string) || '',
  }
}

export const useCustomerAccountsStore = defineStore('customerAccounts', {
  state: () => ({
    accountsByContactKey: {} as Record<string, CustomerAccount>,
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getBalanceForContactKey: (state) => (contactKey: string) =>
      state.accountsByContactKey[contactKey]?.accountBalance ?? 0,
  },

  actions: {
    async fetchAccountsForStore() {
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        this.accountsByContactKey = await buildDemoCustomerAccounts()
        this.loading = false
        this.error = null
        return
      }

      this.loading = true
      this.error = null
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        this.loading = false
        return
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        this.loading = false
        return
      }

      const userId = (await getQueryUserId()) ?? authStore.currentUser.uid
      const storeId = await getCurrentStoreId()
      if (!storeId) {
        this.loading = false
        return
      }

      try {
        const snap = await getDocs(getCustomerAccountsCollection(db, userId, storeId))
        const map: Record<string, CustomerAccount> = {}
        for (const d of snap.docs) {
          const data = d.data()
          const contactKey = (data.contactKey as string) || d.id
          const ledger = Array.isArray(data.balanceLedger)
            ? (data.balanceLedger as Record<string, unknown>[]).map((e, i) =>
                parseLedgerEntry(e, (e.id as string) || `entry-${i}`)
              )
            : []
          map[contactKey] = {
            id: d.id,
            contactKey,
            customerName: (data.customerName as string) || '',
            email: data.email as string | undefined,
            phone: data.phone as string | undefined,
            accountBalance: Number(data.accountBalance) || 0,
            balanceLedger: ledger,
            storeId: (data.storeId as string) || storeId,
            updatedAt: data.updatedAt?.toDate?.() ?? undefined,
          }
        }
        this.accountsByContactKey = map
      } catch (e: unknown) {
        console.error('[CustomerAccountsStore] fetch failed:', e)
        this.error = e instanceof Error ? e.message : 'Failed to load customer balances'
      } finally {
        this.loading = false
      }
    },

    async ensureAccount(params: {
      customerName: string
      email?: string
      phone?: string
    }): Promise<CustomerAccount> {
      const contactKey = getCustomerContactKey(params)
      const existing = this.accountsByContactKey[contactKey]
      if (existing) return existing

      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const storeId = (await getCurrentStoreId()) ?? ''
        const accountId = customerAccountDocId(contactKey)
        const account: CustomerAccount = {
          id: accountId,
          contactKey,
          customerName: params.customerName,
          email: params.email?.toLowerCase().trim(),
          phone: params.phone?.trim(),
          accountBalance: 0,
          balanceLedger: [],
          storeId,
        }
        this.accountsByContactKey[contactKey] = account
        return account
      }

      const db = useFirestore().getFirestoreInstance()
      if (!db) throw new Error(CLOUD_UNAVAILABLE_MESSAGE)

      const authStore = useAuthStore()
      if (!authStore.currentUser) throw new Error('Not authenticated')

      const userId = (await getQueryUserId()) ?? authStore.currentUser.uid
      const storeId = await getCurrentStoreId()
      if (!storeId) throw new Error('No store selected')

      const accountId = customerAccountDocId(contactKey)
      const ref = getCustomerAccountDocument(db, userId, storeId, accountId)
      const snap = await getDoc(ref)

      if (snap.exists()) {
        const data = snap.data()!
        const account: CustomerAccount = {
          id: snap.id,
          contactKey: (data.contactKey as string) || contactKey,
          customerName: (data.customerName as string) || params.customerName,
          email: data.email as string | undefined,
          phone: data.phone as string | undefined,
          accountBalance: Number(data.accountBalance) || 0,
          balanceLedger: Array.isArray(data.balanceLedger)
            ? (data.balanceLedger as Record<string, unknown>[]).map((e, i) =>
                parseLedgerEntry(e, (e.id as string) || `entry-${i}`)
              )
            : [],
          storeId,
        }
        this.accountsByContactKey[contactKey] = account
        return account
      }

      const account: Omit<CustomerAccount, 'id'> & { id?: string } = {
        contactKey,
        customerName: params.customerName,
        email: params.email?.toLowerCase().trim(),
        phone: params.phone?.trim(),
        accountBalance: 0,
        balanceLedger: [],
        storeId,
      }

      await setDoc(ref, {
        ...account,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId,
      })

      const created: CustomerAccount = { ...account, id: accountId }
      this.accountsByContactKey[contactKey] = created
      return created
    },

    async applyLedgerEntry(params: {
      customerName: string
      email?: string
      phone?: string
      type: BalanceLedgerEntryType
      amount: number
      note?: string
      receiptId?: string
    }): Promise<CustomerAccount> {
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const authStore = useAuthStore()
        if (!authStore.currentUser) throw new Error('Not authenticated')
        const userId = authStore.currentUser.uid
        const account = await this.ensureAccount({
          customerName: params.customerName,
          email: params.email,
          phone: params.phone,
        })
        const entryId = `le_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        const entry: BalanceLedgerEntry = {
          id: entryId,
          type: params.type,
          amount: params.amount,
          note: params.note?.trim() || undefined,
          receiptId: params.receiptId,
          createdAt: new Date(),
          createdBy: userId,
        }
        const newBalance = Math.max(0, (account.accountBalance || 0) + params.amount)
        account.accountBalance = newBalance
        account.balanceLedger = [entry, ...account.balanceLedger].slice(0, MAX_LEDGER_ENTRIES)
        this.accountsByContactKey[account.contactKey] = account
        return account
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) throw new Error('Not authenticated')

      const userId = (await getQueryUserId()) ?? authStore.currentUser.uid
      const storeId = await getCurrentStoreId()
      if (!storeId) throw new Error('No store selected')

      const account = await this.ensureAccount({
        customerName: params.customerName,
        email: params.email,
        phone: params.phone,
      })

      const db = useFirestore().getFirestoreInstance()
      if (!db) throw new Error(CLOUD_UNAVAILABLE_MESSAGE)

      const entryId = `le_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const createdAt = new Date()
      const entry = {
        id: entryId,
        type: params.type,
        amount: params.amount,
        note: params.note?.trim() || undefined,
        receiptId: params.receiptId,
        createdAt,
        createdBy: userId,
      }

      const newBalance = Math.max(0, (account.accountBalance || 0) + params.amount)
      const ledger = [entry, ...account.balanceLedger].slice(0, MAX_LEDGER_ENTRIES)

      const ref = getCustomerAccountDocument(db, userId, storeId, account.id)
      await updateDoc(ref, {
        accountBalance: newBalance,
        balanceLedger: arrayUnion(entry),
        customerName: params.customerName,
        email: params.email?.toLowerCase().trim() || account.email,
        phone: params.phone?.trim() || account.phone,
        updatedAt: serverTimestamp(),
      })

      const updated: CustomerAccount = {
        ...account,
        accountBalance: newBalance,
        balanceLedger: ledger,
        updatedAt: new Date(),
      }
      this.accountsByContactKey[account.contactKey] = updated
      return updated
    },
  },
})
