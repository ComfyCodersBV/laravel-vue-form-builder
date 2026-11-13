import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Form from '../../resources/js/components/Form.vue'

const schemaWith = (fields: Record<string, unknown>[], extra: Record<string, unknown> = {}) => ({
    schemaVersion: '1.15',
    id: 'required',
    action: '/',
    method: 'post',
    defaults: {},
    fields,
    ...extra,
})

const labelFor = (wrapper: ReturnType<typeof mount>, id: string) => wrapper.find(`label[for="${id}"]`)

describe('required indicator', () => {
    it('puts a hidden asterisk and a screen reader text after the label of a marked field', () => {
        const wrapper = mount(Form, {
            props: { schema: schemaWith([{ name: 'title', type: 'text', label: 'Title', markRequired: true }], { locale: 'nl' }) },
        })
        const mark = labelFor(wrapper, 'title').find('[data-required-mark]')

        expect(mark.text()).toBe('*')
        expect(mark.attributes('aria-hidden')).toBe('true')
        expect(labelFor(wrapper, 'title').find('.sr-only').text()).toBe('(verplicht)')
    })

    it('leaves fields without markRequired alone', () => {
        const wrapper = mount(Form, { props: { schema: schemaWith([{ name: 'title', type: 'text', label: 'Title' }]) } })

        expect(wrapper.find('[data-required-mark]').exists()).toBe(false)
    })

    it('marks radio and checkbox groups, toggles and single checkboxes once', () => {
        const wrapper = mount(Form, {
            props: {
                schema: schemaWith([
                    { name: 'choice', type: 'radio', label: 'Choice', options: { a: 'A' }, markRequired: true },
                    { name: 'days', type: 'checkboxes', label: 'Days', options: { mo: 'Monday' }, markRequired: true },
                    { name: 'on', type: 'toggle', label: 'On duty', markRequired: true },
                    { name: 'agree', type: 'checkbox', label: 'I agree', markRequired: true },
                    { name: 'terms', type: 'checkbox', label: 'Terms', checkboxLabel: 'I accept', markRequired: true },
                ]),
            },
        })

        expect(wrapper.findAll('[data-required-mark]')).toHaveLength(5)
        expect(labelFor(wrapper, 'on-tgl').find('[data-required-mark]').exists()).toBe(true)
        expect(labelFor(wrapper, 'agree-cb').find('[data-required-mark]').exists()).toBe(true)
        expect(labelFor(wrapper, 'terms-cb').find('[data-required-mark]').exists()).toBe(false)
        expect(labelFor(wrapper, 'terms').find('[data-required-mark]').exists()).toBe(true)
    })

    it('follows a field override and the theme', () => {
        const wrapper = mount(Form, {
            props: {
                schema: schemaWith(
                    [
                        { name: 'a', type: 'text', label: 'A', markRequired: true },
                        { name: 'b', type: 'text', label: 'B' },
                    ],
                    { theme: { required: 'text-amber-600' } },
                ),
                fieldOverrides: { a: { markRequired: false }, b: { markRequired: true } },
            },
        })

        expect(labelFor(wrapper, 'a').find('[data-required-mark]').exists()).toBe(false)
        expect(labelFor(wrapper, 'b').find('[data-required-mark]').classes()).toContain('text-amber-600')
    })

    it('marks only the required locales of a stacked translatable field', () => {
        const wrapper = mount(Form, {
            props: {
                schema: schemaWith([{
                    name: 'name',
                    type: 'translatable',
                    label: 'Name',
                    display: 'stacked',
                    markRequired: true,
                    locales: [{ value: 'nl', label: 'NL' }, { value: 'en', label: 'EN' }],
                    requiredLocales: ['nl'],
                    field: { type: 'text' },
                }]),
            },
        })

        expect(labelFor(wrapper, 'name.nl').find('[data-required-mark]').exists()).toBe(true)
        expect(labelFor(wrapper, 'name.en').find('[data-required-mark]').exists()).toBe(false)
    })
})

describe('plain-text help', () => {
    it('renders helpText as text instead of html', () => {
        const wrapper = mount(Form, {
            props: { schema: schemaWith([{ name: 'a', type: 'text', label: 'A', help: '&lt;b&gt;', helpText: '<b>bold</b>\nnext' }]) },
        })

        expect(wrapper.find('[data-help-text]').text()).toBe('<b>bold</b>\nnext')
        expect(wrapper.find('b').exists()).toBe(false)
    })

    it('keeps rendering help as html', () => {
        const wrapper = mount(Form, { props: { schema: schemaWith([{ name: 'a', type: 'text', label: 'A', help: '<b>bold</b>' }]) } })

        expect(wrapper.find('b').text()).toBe('bold')
    })

    it('takes plain-text help from a field override', () => {
        const wrapper = mount(Form, {
            props: {
                schema: schemaWith([{ name: 'a', type: 'text', label: 'A', help: 'Server help' }]),
                fieldOverrides: { a: { helpText: 'Street <found>' } },
            },
        })

        expect(wrapper.find('[data-help-text]').text()).toBe('Street <found>')
        expect(wrapper.text()).not.toContain('Server help')
    })
})

describe('a checkbox outside the field renderer', () => {
    it('takes markRequired from the field it is rendered in', async () => {
        const { default: CheckboxField } = await import('../../resources/js/components/Fields/CheckboxField.vue')
        const { fieldMetaKey } = await import('../../resources/js/lib/field-meta')
        const { computed } = await import('vue')
        const wrapper = mount(CheckboxField, {
            props: { name: 'agree', label: 'I agree' },
            global: { provide: { [fieldMetaKey as symbol]: computed(() => ({ markRequired: true })) } },
        })

        expect(wrapper.find('[data-required-mark]').exists()).toBe(true)
    })
})
