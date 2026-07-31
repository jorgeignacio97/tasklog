import { formatDate, formatDuration } from './cn'

describe('formatDuration', () => {
  it.each([
    { hours: 0, expected: '0m', label: 'FMT-1 zero hours' },
    { hours: 1.5, expected: '1h 30m', label: 'FMT-2 hours and minutes' },
    { hours: 2, expected: '2h', label: 'FMT-3 whole hours, minutes round to 0' },
    { hours: 0.999, expected: '1h', label: 'FMT-4 rounds up into the next hour' },
    { hours: 1.999, expected: '2h', label: 'FMT-4 rounds up into the next hour (>1h)' },
  ])('$label: formatDuration($hours) === "$expected"', ({ hours, expected }) => {
    expect(formatDuration(hours)).toBe(expected)
  })

  it('FMT-8: clamps negative or NaN hours to 0m instead of throwing or returning garbage', () => {
    expect(formatDuration(-5)).toBe('0m')
    expect(formatDuration(NaN)).toBe('0m')
  })

  it('FMT-9: clamps Infinity and -Infinity to 0m instead of returning "Infinityh"', () => {
    expect(formatDuration(Infinity)).toBe('0m')
    expect(formatDuration(-Infinity)).toBe('0m')
  })
})

describe('formatDate', () => {
  it('FMT-5: renders a date-only input as that same local calendar day', () => {
    const result = formatDate('2026-03-15')
    expect(result).toMatch(/\b15\b/)
  })

  it('FMT-5/D4 branch contract: date-only and midnight-local ISO render identically, and differ from the previous day', () => {
    const dateOnly = formatDate('2026-03-15')
    const midnightLocalIso = formatDate('2026-03-15T00:00:00.000-03:00')
    const previousDay = formatDate('2026-03-14T00:00:00.000-03:00')

    expect(dateOnly).toBe(midnightLocalIso)
    expect(dateOnly).not.toBe(previousDay)
  })

  it('FMT-6: contains the day, a textual month, and the year in that relative order', () => {
    const result = formatDate('2026-03-15')

    expect(result).toMatch(/\b15\b/)
    expect(result).toMatch(/\b2026\b/)

    const monthMatch = result.match(/\p{L}{3,}/u)
    expect(monthMatch).not.toBeNull()

    const dayIndex = result.indexOf('15')
    const yearIndex = result.indexOf('2026')
    const monthIndex = result.indexOf(monthMatch![0])

    expect(dayIndex).toBeLessThan(yearIndex)
    expect(monthIndex).toBeGreaterThan(dayIndex)
    expect(monthIndex).toBeLessThan(yearIndex)
  })

  it('FMT-7: does not throw on invalid date input', () => {
    expect(() => formatDate('not-a-date')).not.toThrow()
  })
})
