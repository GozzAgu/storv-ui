import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const flushQueued = vi.fn()
vi.mock('~/stores/auth', () => ({ useAuthStore: () => ({ currentUser: { uid: 'amaka' } }) }))
vi.mock('~/composables/useSalesApi', () => ({ useSalesApi: () => ({ flushQueued }) }))
vi.mock('~/composables/useAppToast', () => ({
  useAppToast: () => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn() }),
}))

const OfflineSalesCard = (await import('~/components/receipts/OfflineSalesCard.vue')).default
const outbox = await import('~/utils/sales-outbox')

const queued = (saleId: string): Parameters<typeof outbox.enqueueSale>[1] => ({
  saleId,
  ownerUserId: 'owner1',
  storeId: 's1',
  body: {},
  queuedAt: '2026-10-21T09:00:00.000Z',
  summary: `Sale ${saleId}`,
  attempts: 0,
})

function mountCard() {
  return mount(OfflineSalesCard, {
    attachTo: document.body,
    global: {
      stubs: {
        SDialog: {
          props: ['open', 'title'],
          template:
            '<div v-if="open" class="dialog"><p>{{ title }}</p><slot name="footer" /></div>',
        },
      },
    },
  })
}

describe('OfflineSalesCard', () => {
  beforeEach(() => {
    localStorage.clear()
    flushQueued.mockReset()
    flushQueued.mockResolvedValue({ recorded: [], failed: [], remaining: 0 })
  })

  it('shows nothing when every sale has synced', () => {
    expect(mountCard().find('.s-offline-sales').exists()).toBe(false)
  })

  it('lists waiting and refused sales with the server’s reason', async () => {
    outbox.enqueueSale('amaka', queued('w1'))
    outbox.enqueueSale('amaka', queued('r1'))
    outbox.markSaleFailed(
      'amaka',
      outbox.listQueuedSales('amaka')[1]!,
      'Not enough USB-C in stock.'
    )
    const wrapper = mountCard()
    await flushPromises()
    expect(wrapper.text()).toContain('1 waiting')
    expect(wrapper.text()).toContain('1 not recorded')
    expect(wrapper.text()).toContain('Not enough USB-C in stock.')
    wrapper.unmount()
  })

  it('tries a refused sale again', async () => {
    outbox.enqueueSale('amaka', queued('r1'))
    outbox.markSaleFailed('amaka', outbox.listQueuedSales('amaka')[0]!, 'Too old')
    const wrapper = mountCard()
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Try again')!
      .trigger('click')
    await flushPromises()
    expect(flushQueued).toHaveBeenCalled()
    expect(outbox.listQueuedSales('amaka').map((s) => s.saleId)).toEqual(['r1'])
    wrapper.unmount()
  })

  it('asks before dismissing a sale that was never recorded', async () => {
    outbox.enqueueSale('amaka', queued('r1'))
    outbox.markSaleFailed('amaka', outbox.listQueuedSales('amaka')[0]!, 'Too old')
    const wrapper = mountCard()
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Dismiss')!
      .trigger('click')
    expect(wrapper.find('.dialog').text()).toContain('Dismiss this sale?')
    expect(outbox.listFailedSales('amaka')).toHaveLength(1)
    await wrapper
      .find('.dialog')
      .findAll('button')
      .find((b) => b.text() === 'Dismiss')!
      .trigger('click')
    expect(outbox.listFailedSales('amaka')).toHaveLength(0)
    wrapper.unmount()
  })
})
