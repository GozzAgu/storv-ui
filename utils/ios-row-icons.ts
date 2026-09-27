import type { Component } from 'vue'
import {
  ArrowLeftRight,
  Ban,
  CircleCheck,
  HandCoins,
  Handshake,
  Hourglass,
  Link2,
  MessageCircle,
  Package,
  PackageCheck,
  PackageOpen,
  PencilLine,
  Plus,
  ReceiptText,
  Repeat2,
  ShoppingBag,
  Target,
  Trash2,
  Undo2,
  UserRound,
  UserRoundX,
} from '@lucide/vue'
import type { InventoryAvailabilityStatus } from '~/utils/inventory-availability'

export type IosRowIconKey =
  | 'sale'
  | 'sale-pending'
  | 'sale-refunded'
  | 'sale-cancelled'
  | 'balance-due'
  | 'customer'
  | 'item-in-stock'
  | 'item-returned'
  | 'item-sold'
  | 'item-with-seller'
  | 'item-awaiting-payment'
  | 'stock-loan'
  | 'staff'
  | 'staff-removed'
  | 'lead'
  | 'buyback'
  | 'payment-link'
  | 'paid'
  | 'transfer'
  | 'inquiry'
  | 'order'
  | 'activity-created'
  | 'activity-updated'
  | 'activity-deleted'
  | 'cancelled'

export const IOS_ROW_ICONS: Record<IosRowIconKey, Component> = {
  sale: ReceiptText,
  'sale-pending': Hourglass,
  'sale-refunded': Undo2,
  'sale-cancelled': Ban,
  'balance-due': HandCoins,
  customer: UserRound,
  'item-in-stock': Package,
  'item-returned': PackageOpen,
  'item-sold': PackageCheck,
  'item-with-seller': Handshake,
  'item-awaiting-payment': Hourglass,
  'stock-loan': Handshake,
  staff: UserRound,
  'staff-removed': UserRoundX,
  lead: Target,
  buyback: Repeat2,
  'payment-link': Link2,
  paid: CircleCheck,
  transfer: ArrowLeftRight,
  inquiry: MessageCircle,
  order: ShoppingBag,
  'activity-created': Plus,
  'activity-updated': PencilLine,
  'activity-deleted': Trash2,
  cancelled: Ban,
}

export function itemAvailabilityIcon(status: InventoryAvailabilityStatus): IosRowIconKey {
  switch (status) {
    case 'available':
      return 'item-in-stock'
    case 'returned':
      return 'item-returned'
    case 'sold':
      return 'item-sold'
    case 'with_seller':
      return 'item-with-seller'
    default:
      return 'item-awaiting-payment'
  }
}
