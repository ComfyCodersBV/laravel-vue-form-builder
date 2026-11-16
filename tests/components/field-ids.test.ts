import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import Form from '../../resources/js/components/Form.vue'

const schemaWith = (id: string, fields: Record<string, unknown>[], defaults: Record<string, unknown> = {}) => ({
    schemaVersion: '1.16',
    id,
    action: '/',
    method: 'post',
    defaults,
    fields,
})

const twoForms = (first: Record<string, unknown>, second: Record<string, unknown>) => mount(defineComponent({
    render: () => h('div', [h(Form, { schema: first }), h(Form, { schema: second })]),
}), { attachTo: document.body })

describe('field ids', () => {
    it('prefixes the id of a field with the id of its form', () => {
        const wrapper = mount(Form, { props: { schema: schemaWith('contact', [{ name: 'email', type: 'text', label: 'Email' }]) } })

        expect(wrapper.find('input[name="email"]').attributes('id')).toBe('contact-email')
        expect(wrapper.find('label').attributes('for')).toBe('contact-email')
    })

    it('keeps the ids of two forms with the same field apart', () => {
        const wrapper = twoForms(
            schemaWith('login', [{ name: 'email', type: 'text', label: 'Email' }]),
            schemaWith('newsletter', [{ name: 'email', type: 'text', label: 'Email' }]),
        )

        const ids = wrapper.findAll('input[name="email"]').map((input) => input.attributes('id'))
        const targets = wrapper.findAll('label').map((label) => label.attributes('for'))

        expect(ids).toEqual(['login-email', 'newsletter-email'])
        expect(targets).toEqual(ids)

        wrapper.unmount()
    })

    it('gives forms without an id a generated one that differs per form', () => {
        const wrapper = twoForms(
            schemaWith('', [{ name: 'email', type: 'text' }]),
            schemaWith('', [{ name: 'email', type: 'text' }]),
        )

        const [first, second] = wrapper.findAll('form')
        const ids = wrapper.findAll('input[name="email"]').map((input) => input.attributes('id'))

        expect(first!.attributes('id')).toBeTruthy()
        expect(second!.attributes('id')).not.toBe(first!.attributes('id'))
        expect(ids).toEqual([`${first!.attributes('id')}-email`, `${second!.attributes('id')}-email`])

        wrapper.unmount()
    })

    it('adds the repeater and row to the ids of its sub-fields', () => {
        const wrapper = mount(Form, {
            props: {
                schema: schemaWith(
                    'order',
                    [{ name: 'lines', type: 'repeater', fields: [{ name: 'amount', type: 'text', label: 'Amount' }] }],
                    { lines: [{ amount: '1' }, { amount: '2' }] },
                ),
            },
        })

        const rows = wrapper.findAll('[data-repeater-row]')

        expect(rows[0]!.find('input').attributes('id')).toBe('order-lines-0-amount')
        expect(rows[0]!.find('label').attributes('for')).toBe('order-lines-0-amount')
        expect(rows[1]!.find('input').attributes('id')).toBe('order-lines-1-amount')
    })

    it('prefixes the ids of options, checkboxes and toggles', () => {
        const wrapper = mount(Form, {
            props: {
                schema: schemaWith('prefs', [
                    { name: 'size', type: 'radio', options: { s: 'Small' } },
                    { name: 'days', type: 'checkboxes', options: { mon: 'Monday' } },
                    { name: 'active', type: 'checkbox', label: 'Active' },
                    { name: 'on', type: 'toggle', label: 'On duty' },
                ]),
            },
        })

        expect(wrapper.find('#prefs-size-s').exists()).toBe(true)
        expect(wrapper.find('label[for="prefs-size-s"]').exists()).toBe(true)
        expect(wrapper.find('#prefs-days-mon').exists()).toBe(true)
        expect(wrapper.find('#prefs-active-cb').exists()).toBe(true)
        expect(wrapper.find('label[for="prefs-active-cb"]').exists()).toBe(true)
        expect(wrapper.find('#prefs-on-tgl').exists()).toBe(true)
    })

    it('prefixes the ids of the fields in a wizard step', () => {
        const wrapper = mount(Form, {
            props: {
                schema: schemaWith('booking', [
                    { type: 'step', name: 'when', title: 'When', fields: [{ name: 'day', type: 'text' }] },
                ]),
            },
        })

        expect(wrapper.find('input[name="day"]').attributes('id')).toBe('booking-day')
    })
})
