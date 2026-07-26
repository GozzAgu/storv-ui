import { describe, expect, it } from 'vitest'
import {
  getStoreBranchCodeLabel,
  getStoreBranchShortLabel,
} from '~/utils/store-branch-label'

describe('getStoreBranchShortLabel', () => {
  it('returns known city when branch name equals city', () => {
    expect(getStoreBranchShortLabel('Port Harcourt')).toBe('Port Harcourt')
    expect(getStoreBranchShortLabel('Lagos')).toBe('Lagos')
  })

  it('strips suffix after comma or dash', () => {
    expect(getStoreBranchShortLabel('Port Harcourt, GRA')).toBe('Port Harcourt')
    expect(getStoreBranchShortLabel('Lagos - Victoria Island')).toBe('Lagos')
    expect(getStoreBranchShortLabel('Abuja | Wuse 2')).toBe('Abuja')
  })

  it('matches multi-word cities at the start of longer branch names', () => {
    expect(getStoreBranchShortLabel('Benin City Main')).toBe('Benin City')
    expect(getStoreBranchShortLabel('New York Downtown')).toBe('New York')
    expect(getStoreBranchShortLabel('Port Elizabeth Central')).toBe('Port Elizabeth')
  })

  it('handles empty input', () => {
    expect(getStoreBranchShortLabel('')).toBe('')
    expect(getStoreBranchShortLabel(undefined)).toBe('')
  })

  it('falls back to full name when no city pattern matches', () => {
    expect(getStoreBranchShortLabel('Main Warehouse')).toBe('Main Warehouse')
  })
})

describe('getStoreBranchCodeLabel', () => {
  it('returns mapped codes for Nigerian cities', () => {
    expect(getStoreBranchCodeLabel('Lagos')).toBe('LAG')
    expect(getStoreBranchCodeLabel('Abuja')).toBe('ABJ')
    expect(getStoreBranchCodeLabel('Port Harcourt, GRA')).toBe('PHC')
    expect(getStoreBranchCodeLabel('Lagos - Victoria Island')).toBe('LAG')
  })

  it('generates a three-letter code for unmapped cities', () => {
    expect(getStoreBranchCodeLabel('Main Warehouse')).toBe('MWA')
  })

  it('handles empty input', () => {
    expect(getStoreBranchCodeLabel('')).toBe('')
    expect(getStoreBranchCodeLabel(undefined)).toBe('')
  })
})
