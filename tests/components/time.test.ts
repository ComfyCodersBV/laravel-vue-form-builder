import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import TimeField from '../../resources/js/components/Fields/TimeField.vue'
import FormField from '../../resources/js/components/FormField.vue'
import { buildTimeSlots, closestSlotIndex, normalizeTime, stepTime } from '../../resources/js/lib/time'

describe('normalizeTime', () => {
    it.each([
        ['9', '09:00'],
        ['930', '09:30'],
        ['0930', '09:30'],
        ['9.30', '09:30'],
        ['9,30', '09:30'],
        ['9:30', '09:30'],
        ['14:30', '14:30'],
        ['1430', '14:30'],
        [' 23:59 ', '23:59'],
        ['0', '00:00'],
    ])('turns %j into %j', (input, expected) => {
        expect(normalizeTime(input)).toEqual({ valid: true, value: expected })
    })

    it.each(['25:00', '24:00', '12:60', '1260', 'abc', '9:3', '12345', '9:30pm'])('rejects %j', (input) => {
        expect(normalizeTime(input)).toEqual({ valid: false, value: null })
    })

    it('keeps an empty value empty', () => {
        expect(normalizeTime('')).toEqual({ valid: true, value: null })
        expect(normalizeTime('   ')).toEqual({ valid: true, value: null })
        expect(normalizeTime(null)).toEqual({ valid: true, value: null })
    })
})

describe('time slots', () => {
    it('covers the whole day in quarters by default', () => {
        const slots = buildTimeSlots()

        expect(slots).toHaveLength(96)
        expect(slots[0]).toBe('00:00')
        expect(slots[95]).toBe('23:45')
    })

    it('limits the slots to min and max', () => {
        expect(buildTimeSlots(60, '08:00', '11:00')).toEqual(['08:00', '09:00', '10:00', '11:00'])
    })

    it('finds the slot nearest to a time', () => {
        const slots = buildTimeSlots(15)

        expect(slots[closestSlotIndex(slots, 9 * 60 + 8)]).toBe('09:15')
        expect(slots[closestSlotIndex(slots, 9 * 60 + 7)]).toBe('09:00')
    })

    it('steps forward and back and wraps around midnight', () => {
        const slots = buildTimeSlots(15)

        expect(stepTime(slots, 9 * 60, 1)).toBe('09:15')
        expect(stepTime(slots, 9 * 60 + 5, 1)).toBe('09:15')
        expect(stepTime(slots, 9 * 60, -1)).toBe('08:45')
        expect(stepTime(slots, 23 * 60 + 45, 1)).toBe('00:00')
        expect(stepTime(slots, 0, -1)).toBe('23:45')
    })
})

describe('TimeField', () => {
    const mounted: Array<{ unmount: () => void }> = []

    beforeAll(() => {
        vi.stubGlobal('ResizeObserver', class {
            observe(): void {}
            unobserve(): void {}
            disconnect(): void {}
        })
    })

    afterEach(() => {
        mounted.splice(0).forEach((wrapper) => wrapper.unmount())
        document.body.innerHTML = ''
    })

    function mountField(props: Record<string, unknown> = {}) {
        const wrapper = mount(TimeField, {
            props: { name: 'starts_at', ...props },
            attachTo: document.body,
        })

        mounted.push(wrapper)

        return wrapper
    }

    function options(): HTMLElement[] {
        return Array.from(document.querySelectorAll<HTMLElement>('[role="option"]'))
    }

    it('normalizes typed input on blur', async () => {
        const wrapper = mountField()
        const input = wrapper.get('input')

        await input.setValue('930')
        await input.trigger('blur')

        expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['09:30'])
        expect(input.element.value).toBe('09:30')
    })

    it('keeps invalid input and marks it invalid', async () => {
        const wrapper = mountField({ modelValue: '09:00' })
        const input = wrapper.get('input')

        await input.setValue('25:00')
        await input.trigger('keydown', { key: 'Enter' })

        expect(input.element.value).toBe('25:00')
        expect(input.attributes('aria-invalid')).toBe('true')
        expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['25:00'])
    })

    it('emits null when the input is emptied', async () => {
        const wrapper = mountField({ modelValue: '09:00' })
        const input = wrapper.get('input')

        await input.setValue('')
        await input.trigger('blur')

        expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([null])
    })

    it('steps by the configured interval with the arrow keys and wraps around midnight', async () => {
        const wrapper = mountField({ modelValue: '23:30', step: 30 })
        const input = wrapper.get('input')

        await input.trigger('keydown', { key: 'ArrowDown' })
        await wrapper.setProps({ modelValue: '00:00' })
        await input.trigger('keydown', { key: 'ArrowUp' })

        expect(wrapper.emitted('update:modelValue')).toEqual([['00:00'], ['23:30']])
    })

    it('opens a list of slots on focus and selects the clicked one', async () => {
        const wrapper = mountField({ modelValue: '10:00', step: 60 })

        await wrapper.get('input').trigger('focus')
        await flushPromises()

        expect(options()).toHaveLength(24)
        expect(options().find((option) => option.getAttribute('aria-selected') === 'true')?.textContent?.trim()).toBe('10:00')

        options()[14].click()
        await flushPromises()

        expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['14:00'])
        expect(options()).toHaveLength(0)
    })

    it('closes the list with Escape', async () => {
        const wrapper = mountField()
        const input = wrapper.get('input')

        await input.trigger('focus')
        await flushPromises()
        expect(options().length).toBeGreaterThan(0)

        await input.trigger('keydown', { key: 'Escape' })
        await flushPromises()

        expect(options()).toHaveLength(0)
    })

    it('clears the value when clearable', async () => {
        const wrapper = mountField({ modelValue: '09:00', clearable: true, clearLabel: 'Clear field' })

        await wrapper.get('button[aria-label="Clear field"]').trigger('click')

        expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([null])
    })

    it('offers no clear button or list while readonly', async () => {
        const wrapper = mountField({ modelValue: '09:00', clearable: true, readonly: true })

        await wrapper.get('input').trigger('focus')
        await wrapper.get('input').trigger('keydown', { key: 'ArrowDown' })
        await flushPromises()

        expect(wrapper.find('button[aria-label="Clear field"]').exists()).toBe(false)
        expect(options()).toHaveLength(0)
        expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('is rendered for the time type', () => {
        const wrapper = mount(FormField, {
            props: {
                field: { name: 'starts_at', type: 'time' },
                form: { starts_at: '08:15', errors: {} },
            },
        })

        expect(wrapper.text()).not.toContain('Unknown field type')
        expect(wrapper.get('input').element.value).toBe('08:15')
    })
})
