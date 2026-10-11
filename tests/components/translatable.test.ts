import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import Form from '../../resources/js/components/Form.vue'

const field = {
    name: 'body',
    type: 'translatable',
    label: 'Body',
    locales: [
        { value: 'en', label: 'EN' },
        { value: 'nl', label: 'NL' },
    ],
    defaultLocale: 'en',
    requiredLocales: ['en'],
    field: { type: 'textarea', rules: [] },
}

const schemaWith = (overrides: Record<string, unknown> = {}, defaults: Record<string, unknown> = {}) => ({
    schemaVersion: '1.5',
    id: 'translatable',
    action: '/',
    method: 'post',
    defaults,
    fields: [{ ...field, ...overrides }],
})

const formOf = (wrapper: ReturnType<typeof mount>): any => (wrapper.vm as any).form

describe('translatable field', () => {
    it('starts with a value per locale', () => {
        expect(formOf(mount(Form, { props: { schema: schemaWith() } })).body).toEqual({ en: '', nl: '' })
    })

    it('loads stored translations and drops unknown locales', () => {
        const form = formOf(mount(Form, { props: { schema: schemaWith({}, { body: { nl: 'Hallo', fr: 'Salut' } }) } }))

        expect(form.body).toEqual({ en: '', nl: 'Hallo' })
    })

    it('puts a plain stored string in the default locale', () => {
        expect(formOf(mount(Form, { props: { schema: schemaWith({}, { body: 'Hello' }) } })).body).toEqual({ en: 'Hello', nl: '' })
    })

    it('renders a tab and an input per locale and edits the right one', async () => {
        const wrapper = mount(Form, { props: { schema: schemaWith({}, { body: { en: 'Hello', nl: '' } }) } })

        expect(wrapper.findAll('[role="tab"]').map((tab) => tab.text())).toEqual(['EN*', 'NL'])
        expect((wrapper.find('textarea[name="body.en"]').element as HTMLTextAreaElement).value).toBe('Hello')

        await wrapper.find('[data-locale="nl"]').trigger('click')
        await wrapper.find('textarea[name="body.nl"]').setValue('Hallo')

        expect(formOf(wrapper).body).toEqual({ en: 'Hello', nl: 'Hallo' })
        expect(wrapper.find('[data-locale="nl"]').attributes('aria-selected')).toBe('true')
    })

    it('shows the error of a locale on its input and marks its tab', async () => {
        const wrapper = mount(Form, { props: { schema: schemaWith() } })

        formOf(wrapper).setError('body.en', 'The English body is required.')
        await nextTick()

        expect(wrapper.text()).toContain('The English body is required.')
        expect(wrapper.find('[data-locale="en"] [data-locale-error]').exists()).toBe(true)
        expect(wrapper.find('[data-locale="nl"] [data-locale-error]').exists()).toBe(false)
        expect(wrapper.find('[data-form-errors]').exists()).toBe(false)
    })

    it('stacks the inputs with the locale as label', () => {
        const wrapper = mount(Form, { props: { schema: schemaWith({ display: 'stacked' }) } })

        expect(wrapper.find('[role="tab"]').exists()).toBe(false)
        expect(wrapper.findAll('label').map((label) => label.text())).toEqual(['Body', 'EN', 'NL'])
    })
})
