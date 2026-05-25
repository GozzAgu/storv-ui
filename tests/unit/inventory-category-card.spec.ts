import { describe, expect, it } from 'vitest'
import {
 PRIMARY_ACCENT,
 categoryDepartmentAccessLabel,
 categoryDescriptionText,
 categoryTrackingPill,
 formatCategoryDisplayName,
 formatCategoryTypeLabel,
 normalizeAccentColor,
} from '~/utils/inventory-category-card'

describe('inventory-category-card', () => {
 it('shows department access labels', () => {
 expect(
 categoryDepartmentAccessLabel(['d1'], (id) =>
 id === 'd1' ? 'Port Harcourt' : undefined
 )
 ).toBe('Port Harcourt')
 expect(categoryDepartmentAccessLabel([], () => undefined)).toBe('All departments')
 })

 it('title-cases category display names', () => {
 expect(formatCategoryDisplayName('acura')).toBe('Acura')
 expect(formatCategoryDisplayName('alfa romeo')).toBe('Alfa Romeo')
 expect(formatCategoryDisplayName('BMW')).toBe('BMW')
 })

 it('formats type, description, and tracking pill', () => {
 expect(formatCategoryTypeLabel('automotive')).toBe('Automotive')
 expect(categoryDescriptionText('')).toBe('No description added yet.')
 expect(categoryTrackingPill(true, 0).label).toBe('Serial')
 expect(categoryTrackingPill(false, 3).label).toBe('Low stock')
 })

 it('maps legacy blues to Storvv primary', () => {
 expect(normalizeAccentColor('#3B82F6')).toBe(PRIMARY_ACCENT)
 expect(PRIMARY_ACCENT).toBe('#143f8d')
 })
})
