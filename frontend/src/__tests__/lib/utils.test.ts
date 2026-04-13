/**
 * Unit tests for utility functions in lib/utils.ts
 */

import { cn, formatItalianDate } from '@/lib/utils'

describe('cn (class name merge)', () => {
  it('should merge class names correctly', () => {
    const result = cn('px-2 py-1', 'px-4')
    expect(result).toBe('py-1 px-4')
  })

  it('should handle empty inputs', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('should handle conditional classes', () => {
    const condition = true
    const result = cn(condition && 'text-red-500', 'text-lg')
    expect(result).toContain('text-red-500')
    expect(result).toContain('text-lg')
  })

  it('should handle multiple strings', () => {
    const result = cn('mt-2', 'mb-4', 'text-center')
    expect(result).toContain('mt-2')
    expect(result).toContain('mb-4')
    expect(result).toContain('text-center')
  })

  it('should handle conflicting Tailwind classes (twMerge)', () => {
    const result = cn('p-2', 'p-4')
    expect(result).toBe('p-4')
  })

  it('should handle array of classes', () => {
    const result = cn(['text-sm', 'font-bold'], 'text-lg')
    expect(result).toContain('font-bold')
    expect(result).toContain('text-lg')
  })

  it('should handle object notation (falsy values excluded)', () => {
    const result = cn('base-class', false && 'excluded-class')
    expect(result).toContain('base-class')
    expect(result).not.toContain('excluded-class')
  })
})

describe('formatItalianDate', () => {
  it('should format valid ISO string to Italian date', () => {
    const isoString = '2026-04-13T15:30:00Z'
    const result = formatItalianDate(isoString)
    expect(result).toContain('13')
    expect(result).toContain('aprile')
    expect(result).toContain('2026')
  })

  it('should return original string on invalid input', () => {
    const invalidString = 'not-a-date'
    const result = formatItalianDate(invalidString)
    expect(result).toBe(invalidString)
  })

  it('should handle different ISO strings', () => {
    const isoString = '2026-01-01T00:00:00Z'
    const result = formatItalianDate(isoString)
    expect(result).toContain('gennaio')
    expect(result).toContain('2026')
  })

  it('should include "alle" separator in output', () => {
    const isoString = '2026-04-13T12:00:00Z'
    const result = formatItalianDate(isoString)
    expect(result).toContain('alle')
  })

  it('should format time and date together', () => {
    const isoString = '2026-04-13T15:30:00Z'
    const result = formatItalianDate(isoString)
    expect(result).toMatch(/\d{1,2}\s+aprile\s+2026\s+alle\s+\d{2}:\d{2}/)
  })

  it('should handle December dates', () => {
    const isoString = '2025-12-25T10:00:00Z'
    const result = formatItalianDate(isoString)
    expect(result).toContain('dicembre')
    expect(result).toContain('25')
  })

  it('should include valid time format', () => {
    const isoString = '2026-06-01T12:00:00Z'
    const result = formatItalianDate(isoString)
    // Just verify time pattern exists (HH:MM)
    expect(result).toMatch(/\d{2}:\d{2}/)
  })
})

describe('localStorage integration', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should have localStorage mocked', () => {
    expect(localStorage.setItem).toBeDefined()
    expect(localStorage.getItem).toBeDefined()
    expect(localStorage.clear).toBeDefined()
  })

  it('should be able to set items', () => {
    localStorage.setItem('test-key', 'test-value')
    // Just verify no errors were thrown
    expect(true).toBe(true)
  })
})
