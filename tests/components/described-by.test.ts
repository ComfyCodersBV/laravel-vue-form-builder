import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
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

describe('described by', () => {
    it('points a text input at its help text and, once shown, its error', async () => {
        const wrapper = mount(Form, {
            props: { schema: schemaWith([{ name: 'title', type: 'text', label: 'Title', helpText: 'Short' }]) },
        })

        expect(wrapper.find('#order-title').attributes('aria-describedby')).toBe('order-title-help')

        formOf(wrapper).setError({ title: 'Too long.' })
        await nextTick()

        expect(wrapper.find('#order-title').attributes('aria-describedby')).toBe('order-title-help order-title-error')
        expect(wrapper.find('#order-title-error').text()).toBe('Too long.')
    })

    it('leaves the attribute off a field without help or error', () => {
        const wrapper = mount(Form, {
            props: { schema: schemaWith([{ name: 'title', type: 'text', label: 'Title' }]) },
        })

        expect(wrapper.find('#order-title').attributes('aria-describedby')).toBeUndefined()
    })

    it('keeps the currency of a money field next to the help text', () => {
        const wrapper = mount(Form, {
            props: { schema: schemaWith([{ name: 'price', type: 'money', label: 'Price', currency: 'EUR', decimals: 2, help: 'Incl. VAT' }]) },
        })

        expect(wrapper.find('#order-price').attributes('aria-describedby')).toBe('order-price-currency order-price-help')
    })

    it('points a single checkbox at the help text of its field', () => {
        const wrapper = mount(Form, {
            props: { schema: schemaWith([{ name: 'terms', type: 'checkbox', label: 'Terms', helpText: 'Read them first' }]) },
        })

        expect(wrapper.find('#order-terms-cb').attributes('aria-describedby')).toBe('order-terms-help')
        expect(wrapper.find('#order-terms-help').exists()).toBe(true)
    })

    it('points a tags input at the error of one of its entries', async () => {
        const wrapper = mount(Form, {
            props: { schema: schemaWith([{ name: 'emails', type: 'tags', label: 'Emails' }]) },
        })

        formOf(wrapper).setError({ 'emails.0': 'Not an e-mail address.' })
        await nextTick()

        expect(wrapper.find('#order-emails').attributes('aria-describedby')).toBe('order-emails-error')
        expect(wrapper.find('#order-emails-error').exists()).toBe(true)
    })

    it('points a group of checkboxes at its error', async () => {
        const wrapper = mount(Form, {
            props: { schema: schemaWith([{ name: 'ids', type: 'checkboxes', label: 'Ids', options: { 1: 'One' } }]) },
        })

        formOf(wrapper).setError({ ids: 'Pick one.' })
        await nextTick()

        expect(wrapper.find('[role="group"]').attributes('aria-describedby')).toBe('order-ids-error')
    })

    it('points an input in a repeater table at the help text of its column', () => {
        const wrapper = mount(Form, {
            props: {
                schema: schemaWith(
                    [{ name: 'lines', type: 'repeater', table: true, fields: [{ name: 'amount', type: 'text', label: 'Amount', helpText: 'Whole units' }] }],
                    { lines: [{ amount: '1' }] },
                ),
            },
        })

        expect(wrapper.find('#order-lines-0-amount').attributes('aria-describedby')).toBe('order-lines-column-amount-help')
    })
})
