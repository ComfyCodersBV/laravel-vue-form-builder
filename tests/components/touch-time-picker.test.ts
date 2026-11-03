import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import TouchDatePicker from '../../resources/js/components/ui/date-picker/TouchDatePicker.vue'
import TouchTimePicker from '../../resources/js/components/ui/date-picker/TouchTimePicker.vue'

const find = <T extends Element = HTMLButtonElement>(selector: string) => document.body.querySelector<T>(selector)!

async function open(wrapper: ReturnType<typeof mount>): Promise<void> {
    await wrapper.find('[data-touch-time]').trigger('click')
    await flushPromises()
}

async function press(selector: string): Promise<void> {
    find(selector).click()
    await flushPromises()
}

function screen(desktop: boolean): void {
    vi.stubGlobal('matchMedia', (query: string) => ({
        matches: desktop,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
    }))
}

describe('touch time picker', () => {
    beforeAll(() => {
        vi.stubGlobal('ResizeObserver', class {
            observe(): void {}
            unobserve(): void {}
            disconnect(): void {}
        })
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.stubGlobal('ResizeObserver', class {
            observe(): void {}
            unobserve(): void {}
            disconnect(): void {}
        })
        document.body.innerHTML = ''
    })

    const picker = (props: Record<string, unknown> = {}) => mount(TouchTimePicker, {
        attachTo: document.body,
        props,
    })

    it('opens a bottom sheet on a phone and an anchored popover on a desktop', async () => {
        screen(false)
        const phone = picker()

        await open(phone)

        expect(find('[data-touch-sheet]')).not.toBeNull()
        expect(find('[data-touch-anchored]')).toBeNull()

        phone.unmount()
        document.body.innerHTML = ''
        screen(true)
        const desktop = picker()

        await open(desktop)

        expect(find('[data-touch-anchored]')).not.toBeNull()
        expect(find('[data-touch-sheet]')).toBeNull()
    })

    it('opens the date picker as a popover on a desktop as well', async () => {
        screen(true)
        const wrapper = mount(TouchDatePicker, { attachTo: document.body, props: { enableTime: true } })

        await wrapper.find('[data-touch-date]').trigger('click')
        await flushPromises()

        expect(find('[data-touch-calendar][data-touch-anchored]')).not.toBeNull()
    })

    it('keeps its own id on the button in both layouts, so a label points at it', () => {
        screen(false)
        const phone = picker({ id: 'start_time' })
        screen(true)
        const desktop = picker({ id: 'end_time' })

        expect(phone.find('[data-touch-time]').attributes('id')).toBe('start_time')
        expect(desktop.find('[data-touch-time]').attributes('id')).toBe('end_time')
    })

    it('hands a picked day over to the time popover on a desktop', async () => {
        screen(true)
        const wrapper = mount(TouchDatePicker, { attachTo: document.body, props: { enableTime: true } })

        await wrapper.find('[data-touch-date]').trigger('click')
        await flushPromises()
        await press('button[data-date="2026-11-12"]')

        expect(find('[data-touch-clock][data-touch-anchored]')).not.toBeNull()
        expect(find('[data-touch-calendar]')).toBeNull()
    })

    it('offers only the given times and picks hour then minute', async () => {
        const wrapper = picker({ times: ['07:00', '07:30', '08:00', '08:30'] })

        await open(wrapper)

        const hours = [...document.body.querySelectorAll<HTMLElement>('[data-hour]')].map((button) => button.dataset.hour)

        expect(hours).toEqual(['7', '8'])

        await press('button[data-hour="8"]')

        expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['08:00'])

        await wrapper.setProps({ modelValue: '08:00' })
        await press('button[data-minute="30"]')

        expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['08:30'])
    })

    it('disables taken times and an hour whose minutes are all taken', async () => {
        const wrapper = picker({
            modelValue: '18:00',
            hourFrom: 18,
            hourTo: 21,
            minuteStep: 30,
            disabledTimes: ['19:00', '19:30', '20:30'],
        })

        await open(wrapper)

        expect(find('button[data-hour="19"]').disabled).toBe(true)
        expect(find('button[data-hour="20"]').disabled).toBe(false)

        await press('button[data-hour="19"]')

        expect(wrapper.emitted('update:modelValue')).toBeUndefined()

        await press('button[data-hour="20"]')

        expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['20:00'])

        await wrapper.setProps({ modelValue: '20:00' })

        expect(find('button[data-minute="30"]').disabled).toBe(true)
    })

    it('moves to the first free minute when the current minute is taken in the picked hour', async () => {
        const wrapper = picker({ modelValue: '18:00', times: ['18:00', '19:00', '19:30'], isDisabled: (time: string) => time === '19:00' })

        await open(wrapper)
        await press('button[data-hour="19"]')

        expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['19:30'])
    })

    it('offers 24:00 as the end of the day with only its full hour', async () => {
        const wrapper = picker({ modelValue: '24:00', times: ['23:00', '23:30', '24:00'] })

        expect(wrapper.find('[data-touch-time]').text()).toBe('24:00')

        await open(wrapper)

        expect(find('button[data-hour="24"]').getAttribute('aria-pressed')).toBe('true')
        expect(find('button[data-minute="30"]').disabled).toBe(true)
    })

    it('also disables a time written without a leading zero', async () => {
        const wrapper = picker({ modelValue: '08:00', times: ['08:00', '08:30', '09:00'], disabledTimes: ['8:30'] })

        await open(wrapper)

        expect(find('button[data-minute="30"]').disabled).toBe(true)
    })

    it('empties a clearable field', async () => {
        const wrapper = picker({ modelValue: '10:00', clearable: true })

        await open(wrapper)
        await press('[data-touch-clear]')

        expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([''])
    })
})
