import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useDemoAppStore } from '~/stores/demoApp'

/** Demo refunds put the stock back on the device (the dialog no longer calls the cloud). */
describe('demo refundReceipt', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function setup() {
    const demo = useDemoAppStore()
    demo.reset()
    const receipt = demo.currentStore.receipts.find(
      (r) => r.status === 'completed' && r.items.length > 1
    )!
    const item = (id: string) => demo.currentStore.items.find((i) => i.id === id)!
    const before = receipt.items.map((l) => ({ ...item(l.itemId) }))
    return { demo, receipt, item, before }
  }

  it('puts every line back on sale when nothing is faulty', () => {
    const { demo, receipt, item, before } = setup()
    demo.refundReceipt(receipt.id)
    receipt.items.forEach((line, i) => {
      expect(item(line.itemId).sold).toBe(before[i]!.sold - line.quantity)
      expect(item(line.itemId).quantity).toBe(before[i]!.quantity)
    })
    expect(receipt.status).toBe('refunded')
  })

  it('refunds once', () => {
    const { demo, receipt, item, before } = setup()
    demo.refundReceipt(receipt.id)
    demo.refundReceipt(receipt.id)
    expect(item(receipt.items[0]!.itemId).sold).toBe(before[0]!.sold - receipt.items[0]!.quantity)
  })
})
