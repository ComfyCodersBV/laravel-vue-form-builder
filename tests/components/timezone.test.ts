import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import DatePicker from '../../resources/js/components/ui/date-picker/DatePicker.vue'
import { instantOf, offsetMinutes, toDisplayWallClock, toZonedIso } from '../../resources/js/lib/timezone'

describe('timezone helpers', () => {
    it('knows the offset of a timezone at an instant, across daylight saving', () => {
        expect(offsetMinutes(new Date('2026-07-01T12:00:00Z'), 'Europe/Amsterdam')).toBe(120)
        expect(offsetMinutes(new Date('2026-01-01T12:00:00Z'), 'Europe/Amsterdam')).toBe(60)
        expect(offsetMinutes(new Date('2026-01-01T12:00:00Z'), 'America/New_York')).toBe(-300)
    })

    it('turns a wall-clock time in a timezone into an instant', () => {
        const wall = { year: 2026, month: 7, day: 1, hour: 10, minute: 0 }

        expect(instantOf(wall, 'Europe/Amsterdam').toISOString()).toBe('2026-07-01T08:00:00.000Z')
        expect(toZonedIso(wall, 'Europe/Amsterdam')).toBe('2026-07-01T10:00:00+02:00')
        expect(toZonedIso({ ...wall, month: 1 }, 'America/New_York')).toBe('2026-01-01T10:00:00-05:00')
    })

    it('reads values with an offset as instants and values without one in the server timezone', () => {
        expect(toDisplayWallClock('2026-07-01T08:00:00.000000Z', 'Europe/Amsterdam'))
            .toEqual({ year: 2026, month: 7, day: 1, hour: 10, minute: 0 })
        expect(toDisplayWallClock('2026-07-01 08:00:00', 'Europe/Amsterdam', 'UTC'))
            .toEqual({ year: 2026, month: 7, day: 1, hour: 10, minute: 0 })
        expect(toDisplayWallClock('2026-07-01 08:00', 'Europe/Amsterdam'))
            .toEqual({ year: 2026, month: 7, day: 1, hour: 8, minute: 0 })
    })
})

describe('date picker with a timezone', () => {
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

    const mountPicker = (props: Record<string, unknown>) => mount(DatePicker, {
        attachTo: document.body,
        props: { enableTime: true, format: 'YYYY-MM-DD HH:mm', ...props },
    })

    it('shows the value in the field timezone', () => {
        const wrapper = mountPicker({
            modelValue: '2026-07-01 08:00:00',
            timezone: 'Europe/Amsterdam',
            serverTimezone: 'UTC',
        })

        expect(wrapper.text()).toContain('2026-07-01 10:00')
    })

    it('sends an ISO value with the offset of the field timezone', async () => {
        const wrapper = mountPicker({
            modelValue: '2026-07-01T08:00:00Z',
            timezone: 'Europe/Amsterdam',
        })

        await wrapper.find('button').trigger('click')
        await flushPromises()

        const minutes = document.body.querySelector<HTMLInputElement>('input[aria-label="Minutes"]')!
        minutes.value = '30'
        minutes.dispatchEvent(new Event('input'))

        expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['2026-07-01T10:30:00+02:00'])
    })

    it('keeps sending the wall-clock time without a timezone', async () => {
        const wrapper = mountPicker({ modelValue: '2026-07-01 08:00' })

        await wrapper.find('button').trigger('click')
        await flushPromises()

        const minutes = document.body.querySelector<HTMLInputElement>('input[aria-label="Minutes"]')!
        minutes.value = '15'
        minutes.dispatchEvent(new Event('input'))

        expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['2026-07-01 08:15'])
    })
})

describe('date picker display format', () => {
    it('shows the time once when the format already holds it', () => {
        const wrapper = mount(DatePicker, {
            props: { enableTime: true, format: 'DD-MM-YYYY HH:mm', modelValue: '2026-07-01 08:05' },
        })

        expect(wrapper.find('button').text()).toBe('01-07-2026 08:05')
    })
})
