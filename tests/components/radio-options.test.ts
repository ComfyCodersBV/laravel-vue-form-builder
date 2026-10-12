import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Form from '../../resources/js/components/Form.vue'
import { isSafeHref } from '../../resources/js/lib/links'

const schemaWith = (fields: Record<string, unknown>[]) => ({
    schemaVersion: '1.5',
    id: 'radios',
    action: '/',
    method: 'post',
    defaults: {},
    fields,
})

describe('radio options with a description and a link', () => {
    const options = [
        { value: 1, label: 'Hall', description: 'Ground floor', href: '/units/1/move', linkLabel: 'Move' },
        { value: 2, label: 'Attic', href: 'https://example.com/attic', linkLabel: 'View' },
        { value: 3, label: 'Cellar', href: 'javascript:alert(1)', linkLabel: 'Evil' },
        { value: 4, label: 'Garden', help: '<b>Outside</b>' },
    ]

    const wrapper = mount(Form, { props: { schema: schemaWith([{ name: 'unit', type: 'radio', options }]) } })

    it('shows the description as text', () => {
        expect(wrapper.find('[data-option="1"]').text()).toContain('Ground floor')
        expect(wrapper.find('[data-option="4"] b').exists()).toBe(false)
        expect(wrapper.find('[data-option="4"]').text()).toContain('<b>Outside</b>')
    })

    it('renders a link next to the option', () => {
        expect(wrapper.find('[data-option="1"] [data-option-link]').attributes('href')).toBe('/units/1/move')
        expect(wrapper.find('[data-option="1"] [data-option-link]').text()).toBe('Move')
        expect(wrapper.find('[data-option="2"] a[data-option-link]').attributes('rel')).toBe('noopener noreferrer')
    })

    it('renders no link with an unsafe scheme', () => {
        expect(wrapper.find('[data-option="3"] [data-option-link]').exists()).toBe(false)
    })

    it('renders the radios group the core builds from separate radios', () => {
        const grouped = mount(Form, {
            props: {
                schema: schemaWith([
                    { name: 'plan', type: 'radios', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] },
                ]),
            },
        })

        expect(grouped.findAll('[data-option]')).toHaveLength(2)
        expect(grouped.text()).not.toContain('Unknown field type')
    })

    it.each([
        ['/units/1', true],
        ['https://example.com', true],
        ['mailto:x@example.com', true],
        [' javascript:alert(1)', false],
        ['data:text/html,x', false],
        ['', false],
    ])('judges %s as safe: %s', (href, safe) => {
        expect(isSafeHref(href)).toBe(safe)
    })
})

describe('radio option links with a target', () => {
    const wrapper = mount(Form, {
        props: {
            schema: schemaWith([{
                name: 'unit',
                type: 'radio',
                options: [
                    { value: 1, label: 'Hall', href: '/units/1', linkLabel: 'Open', target: '_blank' },
                    { value: 2, label: 'Attic', href: 'https://example.com/attic', linkLabel: 'View', target: '_blank' },
                    { value: 3, label: 'Cellar', href: '/units/3', linkLabel: 'Open', target: '_self' },
                ],
            }]),
        },
    })

    it('opens an internal link in a new tab with a plain anchor', () => {
        const link = wrapper.find('[data-option="1"] [data-option-link]')

        expect(link.element.tagName).toBe('A')
        expect(link.attributes('target')).toBe('_blank')
        expect(link.attributes('rel')).toBe('noopener noreferrer')
    })

    it('opens an external link in a new tab', () => {
        expect(wrapper.find('[data-option="2"] [data-option-link]').attributes('target')).toBe('_blank')
    })

    it('keeps an internal link with target _self on Inertia', () => {
        expect(wrapper.find('[data-option="3"] [data-option-link]').attributes('target')).toBeUndefined()
    })
})
