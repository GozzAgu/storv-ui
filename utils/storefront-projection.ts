import type { InventoryFolder, InventoryItem, TemplateField } from '~/stores/inventory'
import { getItemSellPrice } from '~/utils/inventory-item-cost'
import {
  getInventoryAvailabilityStatus,
  type InventoryAvailabilityStatus,
} from '~/utils/inventory-availability'
import {
  canAllowlistStorefrontField,
  filterAllowlistedFieldIds,
  isCoreStorefrontField,
} from '~/utils/storefront-fields'
import type {
  StorefrontConfig,
  StorefrontPublicAttribute,
  StorefrontPublicAvailability,
  StorefrontPublicListing,
  StorefrontPublicProfile,
} from '~/types/storefront'

function mapPublicAvailability(
  status: InventoryAvailabilityStatus
): StorefrontPublicAvailability {
  return status === 'available' ? 'available' : 'unavailable'
}

function formatAttributeValue(raw: unknown): string {
  if (raw == null) return ''
  if (typeof raw === 'boolean') return raw ? 'Yes' : 'No'
  if (typeof raw === 'number') return Number.isFinite(raw) ? String(raw) : ''
  if (raw instanceof Date) return raw.toISOString().slice(0, 10)
  return String(raw).trim()
}

function resolveCategoryPath(
  folder: InventoryFolder,
  folders: InventoryFolder[]
): { categoryPath: string; categoryName: string } {
  const parentId = folder.parentId ? String(folder.parentId) : ''
  if (parentId) {
    const parent = folders.find((f) => f.id === parentId)
    if (parent?.name) {
      return {
        categoryPath: `${parent.name} / ${folder.name}`,
        categoryName: folder.name,
      }
    }
  }
  return { categoryPath: folder.name, categoryName: folder.name }
}

export function isItemListedOnStorefront(
  item: InventoryItem,
  folder: InventoryFolder,
  config: StorefrontConfig
): boolean {
  if (!config.enabled || !config.slug) return false
  const folderPub = config.folderPublish[folder.id]
  if (!folderPub?.enabled) {
    const parentId = folder.parentId ? String(folder.parentId) : ''
    if (parentId) {
      const parentPub = config.folderPublish[parentId]
      if (!parentPub?.enabled) return false
    } else {
      return false
    }
  }
  const override = config.itemOverrides[item.id]
  if (override?.listed === false) return false

  const availability = mapPublicAvailability(getInventoryAvailabilityStatus(item))
  if (config.listAvailableOnly && availability !== 'available') return false
  return true
}

function resolvePublicFieldIds(
  folder: InventoryFolder,
  config: StorefrontConfig
): string[] {
  const fields = folder.template?.fields ?? []
  const folderPub = config.folderPublish[folder.id]
  const parentId = folder.parentId ? String(folder.parentId) : ''
  const parentPub = parentId ? config.folderPublish[parentId] : undefined
  const rawIds = folderPub?.publicFieldIds?.length
    ? folderPub.publicFieldIds
    : parentPub?.publicFieldIds?.length
      ? parentPub.publicFieldIds
      : []
  return filterAllowlistedFieldIds(rawIds, fields)
}

function buildAttributes(
  item: InventoryItem,
  fields: TemplateField[],
  publicFieldIds: string[]
): StorefrontPublicAttribute[] {
  const byId = new Map(fields.map((f) => [f.id, f]))
  const attrs: StorefrontPublicAttribute[] = []
  for (const id of publicFieldIds) {
    const field = byId.get(id)
    if (!field) continue
    if (!canAllowlistStorefrontField(field.name, field.label)) continue
    if (isCoreStorefrontField(field.name)) continue
    const value = formatAttributeValue(item[field.name])
    if (!value) continue
    attrs.push({ key: field.name, label: field.label || field.name, value })
  }
  return attrs
}

function isDescriptionField(name: string, label: string): boolean {
  const n = `${name} ${label}`.toLowerCase()
  return n.includes('description') || n.includes('details') || n.includes('spec')
}

export function buildStorefrontListing(params: {
  item: InventoryItem
  folder: InventoryFolder
  folders: InventoryFolder[]
  config: StorefrontConfig
  ownerUid: string
  currency?: string
}): StorefrontPublicListing | null {
  const { item, folder, folders, config, ownerUid, currency } = params
  if (!config.enabled || !config.slug) return null

  const listed = isItemListedOnStorefront(item, folder, config)
  const availability = mapPublicAvailability(getInventoryAvailabilityStatus(item))
  const { categoryPath, categoryName } = resolveCategoryPath(folder, folders)
  const fields = folder.template?.fields ?? []
  const publicFieldIds = resolvePublicFieldIds(folder, config)
  const attributes = buildAttributes(item, fields, publicFieldIds)

  const title = String(item.name || item.brand || item.model || 'Product').trim() || 'Product'
  const price = getItemSellPrice(item)
  const descriptionField = fields.find(
    (f) =>
      canAllowlistStorefrontField(f.name, f.label) &&
      publicFieldIds.includes(f.id) &&
      isDescriptionField(f.name, f.label)
  )
  let description: string | undefined
  if (descriptionField) {
    const raw = formatAttributeValue(item[descriptionField.name])
    description = raw || undefined
  }

  const searchParts = [
    title,
    categoryPath,
    ...attributes.map((a) => `${a.label} ${a.value}`),
    description || '',
  ]

  return {
    id: item.id,
    isListed: listed,
    title,
    price,
    currency,
    availability,
    categoryPath,
    categoryName,
    attributes: attributes.filter((a) => a.key !== descriptionField?.name),
    description,
    imageUrl:
      typeof item.imageUrl === 'string' && item.imageUrl.trim()
        ? item.imageUrl.trim()
        : undefined,
    searchText: searchParts.join(' ').toLowerCase().replace(/\s+/g, ' ').trim(),
    sortPrice: price,
    sourceItemId: item.id,
    sourceFolderId: folder.id,
    ownerUid,
    storeId: item.storeId || folder.storeId,
  }
}

export function buildStorefrontPublicProfile(params: {
  config: StorefrontConfig
  ownerUid: string
  storeId: string
  currency?: string
}): StorefrontPublicProfile | null {
  const { config, ownerUid, storeId, currency } = params
  if (!config.slug) return null
  return {
    slug: config.slug,
    isPublished: Boolean(config.enabled),
    ownerUid,
    storeId,
    displayName: config.displayName || 'Store',
    tagline: config.tagline || undefined,
    description: config.description || undefined,
    logoUrl: config.logoUrl || undefined,
    city: config.city || undefined,
    addressPublic: config.addressPublic || undefined,
    phonePublic: config.phonePublic || undefined,
    whatsappE164: config.whatsappE164 || undefined,
    emailPublic: config.emailPublic || undefined,
    social: config.social || {},
    collectionInfo: config.collectionInfo || undefined,
    warrantyInfo: config.warrantyInfo || undefined,
    currency,
    allowReservations: config.allowReservations !== false,
    allowOnlineCheckout: config.allowOnlineCheckout === true,
  }
}
