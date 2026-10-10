import { describe, expect, it } from 'vitest'
import {
  CATEGORY_KINDS,
  CATEGORY_KIND_GROUPS,
  categoryKindLabel,
  inferCategoryKind,
  resolveCategoryKind,
  searchCategoryKinds,
} from '~/utils/category-kinds'
import { categoryKindIcon } from '~/utils/category-kind-icons'
import { Package } from '@lucide/vue'

describe('category kinds', () => {
  it('keeps the original type ids so existing categories still resolve', () => {
    for (const id of [
      'general',
      'electronics',
      'clothing',
      'automotive',
      'food',
      'office',
      'other',
    ]) {
      expect(categoryKindLabel(id)).not.toBe('')
    }
  })

  it('has unique ids, a known group and its own icon for every kind', () => {
    const ids = CATEGORY_KINDS.map((k) => k.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const k of CATEGORY_KINDS) {
      expect(CATEGORY_KIND_GROUPS).toContain(k.group)
      if (k.id !== 'general') expect(categoryKindIcon(k.id)).not.toBe(Package)
    }
  })

  it.each([
    ['iPhones', 'phones'],
    ['iPhone chargers', 'accessories'],
    ['iPhone cases', 'accessories'],
    ['Pillow cases', 'bedding'],
    ['MacBooks', 'computers'],
    ['Tablets', 'tablets'],
    ['Lattafa perfumes', 'fragrance'],
    ['Ankara fabrics', 'fabrics'],
    ['Table water', 'drinks'],
    ['Water tanks', 'plumbing'],
    ['Iron rods', 'building'],
    ['Cement', 'building'],
    ['Toyota Camry', 'vehicles'],
    ['Toyota spare parts', 'automotive'],
    ['Tyres', 'automotive'],
    ['Engine oil', 'fuel'],
    ['Laptop bags', 'computers'],
    ['Footwear', 'shoes'],
    ['Cakes', 'bakery'],
    ['Paracetamol syrup', 'pharmacy'],
    ['Dog food', 'pets'],
  ])('guesses %s as %s', (name, kind) => {
    expect(inferCategoryKind(name)).toBe(kind)
  })

  it('a chosen specific kind wins over the name', () => {
    expect(resolveCategoryKind('fragrance', 'iPhones')).toBe('fragrance')
  })

  it('vague or missing kinds fall back to the names, then to the chosen kind', () => {
    expect(resolveCategoryKind('general', 'Samsung')).toBe('phones')
    expect(resolveCategoryKind('', 'Misc', 'Laptops')).toBe('computers')
    expect(resolveCategoryKind('other', 'Misc')).toBe('other')
    expect(resolveCategoryKind(undefined, 'Misc')).toBe('general')
    expect(resolveCategoryKind('not-a-kind', 'Misc')).toBe('general')
  })

  it('search matches labels, groups and keywords', () => {
    expect(searchCategoryKinds('').length).toBe(CATEGORY_KINDS.length)
    expect(searchCategoryKinds('wig').map((k) => k.id)).toContain('hair')
    expect(searchCategoryKinds('food & drink').map((k) => k.id)).toContain('bakery')
    expect(searchCategoryKinds('iphone').map((k) => k.id)).toContain('phones')
  })
})
