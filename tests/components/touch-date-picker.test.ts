import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import TouchDatePicker from '../../resources/js/components/ui/date-picker/TouchDatePicker.vue'
import DateField from '../../resources/js/components/Fields/DateField.vue'

const find = <T extends Element = HTMLButtonElement>(selector: string) => document.body.querySelector<T>(selector)!

async function open(wrapper: ReturnType<typeof mount>, selector: string): Promise<void> {
    await wrapper.find(selector).trigger('click')
    await flushPromises()
}

async function press(selector: string): Promise<void> {
    find(selector).click()
    await flushPromises()
}

describe('touch date picker', () => {
    beforeAll(() => {
        vi.stubGlobal('ResizeObserver', class {
            observe(): void {}
            unobserve(): void {}
            disconnect(): void {}
        })
    })

    beforeEach(() => {
        vi.useFakeTimers({ now: new Date(2026, 10, 3, 9, 0), toFake: ['Date'] })
    })

    afterEach(() => {
        vi.useRealTimers()
        document.body.innerHTML = ''
    })

    const picker = (props: Record<string, unknown> = {}) => mount(TouchDatePicker, {
        attachTo: document.body,
        props: { enableTime: true, weekStartsOn: 1, ...props },
    })

    it('starts the week on Monday and marks today', async () => {
        const wrapper = picker()

        await open(wrapper, '[data-touch-date]')

        expect(find('button[data-date]').dataset.date).toBe('2026-10-26')
        expect(find('button[data-date="2026-11-03"]').getAttribute('aria-current')).toBe('date')
    })

    it('fills in the first hour when a day is picked without a time, then opens the time sheet', async () => {
        const wrapper = picker({ hourFrom: 8 })

        await open(wrapper, '[data-touch-date]')
        await press('button[data-date="2026-11-12"]')

        expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['2026-11-12 08:00'])
        expect(wrapper.find('[data-touch-time]').text()).toBe('08:00')
        expect(find('button[data-hour]')).not.toBeNull()

        await press('button[data-hour="19"]')
        await press('button[data-minute="30"]')

        expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['2026-11-12 19:30'])
    })

    it('empties a clearable field from either sheet', async () => {
        const wrapper = picker({ modelValue: '2026-11-12 19:30', clearable: true })

        await open(wrapper, '[data-touch-time]')
        await press('[data-touch-clear]')

        expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([''])
        expect(wrapper.find('[data-touch-date]').text()).toBe('Pick a date')
    })

    it('offers no clear button on a field that is not clearable', async () => {
        const wrapper = picker({ modelValue: '2026-11-12 19:30' })

        await open(wrapper, '[data-touch-date]')

        expect(find('[data-touch-clear]')).toBeNull()
    })

    it('builds the zoned value from the picked wall clock, also in a daylight saving gap', async () => {
        const zone = process.env.TZ
        process.env.TZ = 'Europe/Amsterdam'
        const wrapper = picker({ modelValue: '2027-03-28T10:00:00+02:00', timezone: 'Europe/Amsterdam' })

        await open(wrapper, '[data-touch-time]')
        await press('button[data-hour="2"]')
        await press('button[data-minute="30"]')

        expect(String(wrapper.emitted('update:modelValue')?.at(-1)?.[0])).toMatch(/^2027-03-28T02:30:00[+-]\d{2}:\d{2}$/)
        process.env.TZ = zone
    })

    it('labels each day with its full date and marks the buttons as opening a dialog', async () => {
        const wrapper = picker({ locale: 'en-GB' })

        expect(wrapper.find('[data-touch-date]').attributes('aria-haspopup')).toBe('dialog')
        expect(wrapper.find('[data-touch-time]').attributes('aria-haspopup')).toBe('dialog')

        await open(wrapper, '[data-touch-date]')

        expect(find('button[data-date="2026-11-12"]').getAttribute('aria-label')).toBe('Thursday, 12 November 2026')
    })

    it('keeps the time when another day is picked', async () => {
        const wrapper = picker({ modelValue: '2026-11-12 19:30' })

        await open(wrapper, '[data-touch-date]')
        await press('button[data-date="2026-11-13"]')

        expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['2026-11-13 19:30'])
        expect(find('button[data-hour]')).toBeNull()
    })

    it('offers the hours and minute steps it is given, plus the stored time', async () => {
        const wrapper = picker({ modelValue: '2026-11-12 06:10', minuteStep: 15, hourFrom: 8, hourTo: 22 })

        await open(wrapper, '[data-touch-time]')

        const hours = [...document.body.querySelectorAll<HTMLElement>('[data-hour]')].map((button) => Number(button.dataset.hour))
        const minutes = [...document.body.querySelectorAll<HTMLElement>('[data-minute]')].map((button) => Number(button.dataset.minute))

        expect(hours[0]).toBe(6)
        expect(hours[1]).toBe(8)
        expect(hours.at(-1)).toBe(22)
        expect(minutes).toEqual([0, 10, 15, 30, 45])
    })

    it('does not pick a disabled or out-of-bounds day', async () => {
        const wrapper = picker({
            modelValue: '2026-11-12 10:00',
            minDate: '2026-11-05',
            disabledWeekdays: [0],
            disabledDates: ['2026-11-18'],
        })

        await open(wrapper, '[data-touch-date]')

        expect(find('button[data-date="2026-11-04"]').disabled).toBe(true)
        expect(find('button[data-date="2026-11-15"]').disabled).toBe(true)
        expect(find('button[data-date="2026-11-18"]').disabled).toBe(true)

        await press('button[data-date="2026-11-18"]')

        expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('picks a date without time when time is off', async () => {
        const wrapper = picker({ enableTime: false })

        expect(wrapper.find('[data-touch-time]').exists()).toBe(false)

        await open(wrapper, '[data-touch-date]')
        await press('button[data-date="2026-11-12"]')

        expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['2026-11-12'])
    })

    it('is used by a date field only when touch is asked and it is no range', () => {
        const touch = mount(DateField, { props: { name: 'starts_at', type: 'date', touch: true, enableTime: true } })
        const range = mount(DateField, { props: { name: 'period', type: 'date', touch: true, range: true } })
        const classic = mount(DateField, { props: { name: 'starts_at', type: 'date', enableTime: true } })

        expect(touch.find('[data-touch-picker]').exists()).toBe(true)
        expect(range.find('[data-touch-picker]').exists()).toBe(false)
        expect(classic.find('[data-touch-picker]').exists()).toBe(false)
    })
})
