import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import DatePicker from '../../resources/js/components/ui/date-picker/DatePicker.vue'
import Form from '../../resources/js/components/Form.vue'
import { isUnavailableDate } from '../../resources/js/lib/dates'

describe('unavailable dates', () => {
    it.each([
        ['2026-10-12', false],
        ['2026-10-17', true],
        ['2026-10-14', true],
        ['2026-12-21', true],
        ['2027-01-03', true],
        ['2027-01-04', false],
        ['2027-06-02', true],
    ])('judges %s as unavailable: %s', (day, unavailable) => {
        const [year, month, date] = day.split('-').map(Number)

        expect(isUnavailableDate(new Date(year, month - 1, date), [0, 6], [
            '2026-10-14',
            { from: '2026-12-21', to: '2027-01-03' },
            { from: '2027-06-01' },
        ])).toBe(unavailable)
    })

    it('ignores a range without bounds', () => {
        expect(isUnavailableDate(new Date(2026, 9, 12), [], [{}])).toBe(false)
    })
})

describe('date picker with disabled dates', () => {
    beforeAll(() => {
        vi.stubGlobal('ResizeObserver', class {
            observe(): void {}
            unobserve(): void {}
            disconnect(): void {}
        })
    })

    afterEach(() => {
        vi.useRealTimers()
        document.body.innerHTML = ''
    })

    const openPicker = async (props: Record<string, unknown>) => {
        const wrapper = mount(DatePicker, {
            attachTo: document.body,
            props: { modelValue: '2026-10-12', disabledWeekdays: [0, 6], disabledDates: ['2026-10-14'], ...props },
        })

        await wrapper.find('button').trigger('click')
        await flushPromises()

        return wrapper
    }

    const day = (date: string) => document.body.querySelector<HTMLButtonElement>(`button[data-date="${date}"]`)!

    it('greys out disabled weekdays and dates', async () => {
        await openPicker({})

        expect(day('2026-10-17').disabled).toBe(true)
        expect(day('2026-10-18').disabled).toBe(true)
        expect(day('2026-10-14').disabled).toBe(true)
        expect(day('2026-10-14').className).toContain('line-through')
        expect(day('2026-10-13').disabled).toBe(false)
    })

    it('does not select a disabled day', async () => {
        const wrapper = await openPicker({})

        day('2026-10-14').disabled = false
        day('2026-10-14').click()
        day('2026-10-13').click()

        expect(wrapper.emitted('update:modelValue')).toEqual([['2026-10-13']])
    })

    it('disables the today button on an unavailable day', async () => {
        vi.useFakeTimers({ toFake: ['Date'] })
        vi.setSystemTime(new Date(2026, 9, 17, 12))

        await openPicker({})

        const today = [...document.body.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.trim() === 'Today')!

        expect(today.disabled).toBe(true)
    })

    it('reaches the picker through the date field schema', async () => {
        mount(Form, {
            attachTo: document.body,
            props: {
                schema: {
                    schemaVersion: '1.6',
                    action: '/',
                    method: 'post',
                    defaults: { on: '2026-10-12' },
                    fields: [{ name: 'on', type: 'date', disabledWeekdays: [6], disabledDates: [{ from: '2026-10-20', to: '2026-10-21' }] }],
                },
            },
        })

        document.body.querySelector<HTMLButtonElement>('form button')!.click()
        await flushPromises()

        expect(day('2026-10-17').disabled).toBe(true)
        expect(day('2026-10-21').disabled).toBe(true)
        expect(day('2026-10-18').disabled).toBe(false)
    })
})
