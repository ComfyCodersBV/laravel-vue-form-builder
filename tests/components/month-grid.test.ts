import { describe, expect, it } from 'vitest'
import { monthGrid } from '../../resources/js/lib/date-value'

describe('month grid', () => {
    it.each([
        [2026, 1, 1],
        [2026, 1, 0],
        [2026, 10, 1],
        [2026, 7, 1],
    ])('always shows six weeks so the month buttons stay in place (%i-%i)', (year, month, weekStartsOn) => {
        const weeks = monthGrid(year, month, weekStartsOn)

        expect(weeks).toHaveLength(6)
        expect(weeks.every((week) => week.length === 7)).toBe(true)
        expect(weeks.flat().filter((cell) => cell.inMonth)).toHaveLength(new Date(year, month + 1, 0).getDate())
    })

    it('fills the extra weeks with muted days of the next month', () => {
        const last = monthGrid(2026, 1, 1)[5]

        expect(last.every((cell) => !cell.inMonth && cell.date.getMonth() === 2)).toBe(true)
        expect(last[0].date.getDate()).toBe(2)
    })
})
