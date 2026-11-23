import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import DatePicker from '../../resources/js/components/ui/date-picker/DatePicker.vue'
import TouchDatePicker from '../../resources/js/components/ui/date-picker/TouchDatePicker.vue'
import { isoWeekNumber } from '../../resources/js/lib/date-value'

describe('ISO week number', () => {
    it.each([
        ['2025-12-28', 52],
        ['2025-12-29', 1],
        ['2026-01-01', 1],
        ['2026-01-04', 1],
        ['2026-01-05', 2],
        ['2026-03-30', 14],
        ['2026-12-28', 53],
        ['2027-01-01', 53],
        ['2027-01-03', 53],
        ['2027-01-04', 1],
        ['2020-12-31', 53],
        ['2021-01-04', 1],
    ])('puts %s in week %i', (day, week) => {
        const [year, month, date] = day.split('-').map(Number)

        expect(isoWeekNumber(new Date(year, month - 1, date))).toBe(week)
    })
})

describe('week numbers in the pickers', () => {
    beforeAll(() => {
        vi.stubGlobal('ResizeObserver', class {
            observe(): void {}
            unobserve(): void {}
            disconnect(): void {}
        })
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    const weekNumbers = () => Array.from(document.body.querySelectorAll('[data-week-number]')).map((cell) => cell.textContent?.trim())

    it.each([
        [1, ['1', '2', '3', '4', '5', '6']],
        [0, ['1', '2', '3', '4', '5', '6']],
    ])('numbers the rows of January 2026 with the week start on %i', async (weekStartsOn, expected) => {
        const wrapper = mount(DatePicker, {
            attachTo: document.body,
            props: { modelValue: '2026-01-15', weekStartsOn, weekNumbers: true },
        })

        await wrapper.find('button').trigger('click')
        await flushPromises()

        expect(weekNumbers()).toEqual(expected)
        expect(document.body.querySelector('[data-week-number-heading]')?.textContent).toBe('Wk')
    })

    it('shows no week numbers unless asked', async () => {
        const wrapper = mount(DatePicker, { attachTo: document.body, props: { modelValue: '2026-01-15' } })

        await wrapper.find('button').trigger('click')
        await flushPromises()

        expect(weekNumbers()).toEqual([])
    })

    it('numbers the rows of the touch picker across the year boundary', async () => {
        const wrapper = mount(TouchDatePicker, {
            attachTo: document.body,
            props: { modelValue: '2027-01-01', weekStartsOn: 1, weekNumbers: true },
        })

        await wrapper.find('[data-touch-date]').trigger('click')
        await flushPromises()

        expect(weekNumbers()).toEqual(['53', '1', '2', '3', '4', '5'])
    })
})
