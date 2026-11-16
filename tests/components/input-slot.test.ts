import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h, nextTick } from 'vue'
import Form from '../../resources/js/components/Form.vue'

const schemaWith = (fields: Record<string, unknown>[], defaults: Record<string, unknown> = {}) => ({
    schemaVersion: '1.18',
    id: 'order',
    action: '/',
    method: 'post',
    defaults,
    fields,
})

const formOf = (wrapper: ReturnType<typeof mount>): any => (wrapper.vm as any).form

const customSelect = (props: any) => h('select', {
    id: props.id,
    name: props.name,
    class: 'custom-select',
    value: props.modelValue ?? '',
    disabled: props.disabled,
    'aria-describedby': props.describedby,
    'aria-invalid': props.invalid ? 'true' : undefined,
    'aria-required': props.required ? 'true' : undefined,
    onChange: (event: Event) => props.update((event.target as HTMLSelectElement).value),
}, [
    h('option', { value: '' }, ''),
    h('option', { value: 'small' }, 'Small'),
    h('option', { value: 'large' }, 'Large'),
])

describe('input slots', () => {
    it('replaces only the input and keeps the label, help and required marker of the package', () => {
        const wrapper = mount(Form, {
            props: {
                schema: schemaWith([
                    { name: 'size', type: 'text', label: 'Size', helpText: 'Pick one', markRequired: true },
                ], { size: 'small' }),
            },
            slots: { 'input-size': customSelect },
        })

        const select = wrapper.find('select.custom-select')

        expect(wrapper.find('input[name="size"]').exists()).toBe(false)
        expect(select.attributes('id')).toBe('order-size')
        expect(wrapper.find('label').attributes('for')).toBe('order-size')
        expect(wrapper.find('label').text()).toContain('Size')
        expect(wrapper.find('label').text()).toContain('*')
        expect(select.attributes('aria-required')).toBe('true')
        expect(select.attributes('aria-describedby')).toBe('order-size-help')
        expect(wrapper.find('#order-size-help').text()).toBe('Pick one')
        expect((select.element as HTMLSelectElement).value).toBe('small')
    })

    it('writes the chosen value to the form', async () => {
        const wrapper = mount(Form, {
            props: { schema: schemaWith([{ name: 'size', type: 'text', label: 'Size' }]) },
            slots: { 'input-size': customSelect },
        })

        await wrapper.find('select.custom-select').setValue('large')

        expect(formOf(wrapper).size).toBe('large')
    })

    it('shows the error under the input and points the input at it', async () => {
        const wrapper = mount(Form, {
            props: { schema: schemaWith([{ name: 'size', type: 'text', label: 'Size' }]) },
            slots: { 'input-size': customSelect },
        })

        formOf(wrapper).setError({ size: 'Pick a size.' })
        await nextTick()

        const select = wrapper.find('select.custom-select')

        expect(wrapper.find('#order-size-error').text()).toBe('Pick a size.')
        expect(select.attributes('aria-describedby')).toBe('order-size-error')
        expect(select.attributes('aria-invalid')).toBe('true')
    })

    it('points the input at both the help text and the error', async () => {
        const wrapper = mount(Form, {
            props: { schema: schemaWith([{ name: 'size', type: 'text', label: 'Size', help: 'Pick one' }]) },
            slots: { 'input-size': customSelect },
        })

        formOf(wrapper).setError({ size: 'Pick a size.' })
        await nextTick()

        expect(wrapper.find('select.custom-select').attributes('aria-describedby')).toBe('order-size-help order-size-error')
    })

    it('points the input in a repeater table at the help text of its column', () => {
        const wrapper = mount(Form, {
            props: {
                schema: schemaWith(
                    [{ name: 'lines', type: 'repeater', table: true, fields: [{ name: 'size', type: 'text', label: 'Size', helpText: 'Pick one' }] }],
                    { lines: [{ size: 'small' }] },
                ),
            },
            slots: { 'input-size': customSelect },
        })

        expect(wrapper.find('select.custom-select').attributes('aria-describedby')).toBe('order-lines-column-size-help')
    })

    it('takes no input slot for a hidden field', () => {
        const wrapper = mount(Form, {
            props: { schema: schemaWith([{ name: 'size', type: 'hidden' }]) },
            slots: { 'input-size': customSelect },
        })

        expect(wrapper.find('select.custom-select').exists()).toBe(false)
        expect(wrapper.find('input[type="hidden"][name="size"]').exists()).toBe(true)
    })

    it('hands a disabled field to the slot as disabled', () => {
        const wrapper = mount(Form, {
            props: { schema: schemaWith([{ name: 'size', type: 'text', label: 'Size', disabled: 'disabled' }]) },
            slots: { 'input-size': customSelect },
        })

        expect(wrapper.find('select.custom-select').attributes('disabled')).toBeDefined()
    })

    it('scopes the id, value and error to the row inside a repeater', async () => {
        const wrapper = mount(Form, {
            props: {
                schema: schemaWith(
                    [{ name: 'lines', type: 'repeater', fields: [{ name: 'size', type: 'text', label: 'Size' }] }],
                    { lines: [{ size: 'small' }, { size: 'large' }] },
                ),
            },
            slots: { 'input-size': customSelect },
        })

        formOf(wrapper).setError({ 'lines.1.size': 'Too large.' })
        await nextTick()

        const rows = wrapper.findAll('[data-repeater-row]')
        const second = rows[1]!.find('select.custom-select')

        expect(rows[0]!.find('select.custom-select').attributes('id')).toBe('order-lines-0-size')
        expect(rows[1]!.find('label').attributes('for')).toBe('order-lines-1-size')
        expect((second.element as HTMLSelectElement).value).toBe('large')
        expect(rows[0]!.text()).not.toContain('Too large.')
        expect(rows[1]!.text()).toContain('Too large.')

        await rows[0]!.find('select.custom-select').setValue('large')

        expect(formOf(wrapper).lines).toEqual([{ size: 'large' }, { size: 'large' }])
    })

    it('reaches fields inside a section and a wizard step', () => {
        const wrapper = mount(Form, {
            props: {
                schema: schemaWith([
                    { type: 'step', name: 'first', title: 'First', fields: [
                        { type: 'section', title: 'Sizes', fields: [{ name: 'size', type: 'text', label: 'Size' }] },
                    ] },
                    { type: 'step', name: 'second', title: 'Second', fields: [{ name: 'notes', type: 'text' }] },
                ]),
            },
            slots: { 'input-size': customSelect },
        })

        expect(wrapper.find('[data-form-section] select.custom-select').attributes('id')).toBe('order-size')
    })

    it('applies an input slot for the type to every field of that type', () => {
        const wrapper = mount(Form, {
            props: {
                schema: schemaWith(
                    [
                        { name: 'size', type: 'text', label: 'Size' },
                        { name: 'lines', type: 'repeater', fields: [{ name: 'colour', type: 'text', label: 'Colour' }] },
                        { name: 'count', type: 'number', label: 'Count' },
                    ],
                    { lines: [{ colour: 'small' }] },
                ),
            },
            slots: { 'input-text': customSelect },
        })

        expect(wrapper.findAll('select.custom-select').map((select) => select.attributes('id'))).toEqual(['order-size', 'order-lines-0-colour'])
        expect(wrapper.find('label[for="order-lines-0-colour"]').text()).toContain('Colour')
        expect(wrapper.find('input[name="count"]').exists()).toBe(true)
    })

    it('prefers the input slot for the name over the one for the type', () => {
        const wrapper = mount(Form, {
            props: { schema: schemaWith([{ name: 'size', type: 'text', label: 'Size' }]) },
            slots: { 'input-size': customSelect, 'input-text': () => h('p', { class: 'by-type' }) },
        })

        expect(wrapper.find('select.custom-select').exists()).toBe(true)
        expect(wrapper.find('.by-type').exists()).toBe(false)
    })

    it('takes no input slot for the type of a repeater or button', () => {
        const wrapper = mount(Form, {
            props: {
                schema: schemaWith([
                    { name: 'lines', type: 'repeater', fields: [] },
                    { name: 'go', type: 'button', label: 'Go' },
                ]),
            },
            slots: { 'input-repeater': customSelect, 'input-button': customSelect },
        })

        expect(wrapper.find('select.custom-select').exists()).toBe(false)
    })

    it('loses to a slot that replaces the whole field and wins over a slot for the type', () => {
        const byName = mount(Form, {
            props: { schema: schemaWith([{ name: 'size', type: 'text', label: 'Size' }]) },
            slots: { size: () => h('p', { class: 'whole' }), 'input-size': customSelect },
        })

        const byType = mount(Form, {
            props: { schema: schemaWith([{ name: 'size', type: 'text', label: 'Size' }]) },
            slots: { text: () => h('p', { class: 'whole' }), 'input-size': customSelect },
        })

        expect(byName.find('.whole').exists()).toBe(true)
        expect(byName.find('select.custom-select').exists()).toBe(false)
        expect(byType.find('.whole').exists()).toBe(false)
        expect(byType.find('select.custom-select').exists()).toBe(true)
    })
})
