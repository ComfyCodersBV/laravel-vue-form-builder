import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import Form from '../../resources/js/components/Form.vue'
import SortableList from '../../resources/js/components/SortableList.vue'
import { configureFormMessages, resetFormMessages } from '../../resources/js/lib/messages'

const schemaWith = (fields: Record<string, unknown>[], extra: Record<string, unknown> = {}) => ({
    schemaVersion: '1.4',
    id: 'test-form',
    action: '/',
    method: 'post',
    defaults: {},
    fields,
    ...extra,
})

const dateField = { name: 'starts_on', type: 'date' }

describe('built-in messages', () => {
    afterEach(() => {
        resetFormMessages()
    })

    it('defaults to English', () => {
        expect(mount(Form, { props: { schema: schemaWith([dateField]) } }).text()).toContain('Pick a date')
    })

    it('follows the locale of the schema', () => {
        const wrapper = mount(Form, { props: { schema: schemaWith([dateField], { locale: 'nl' }) } })

        expect(wrapper.text()).toContain('Kies datum')
    })

    it('falls back from a regional locale to its language and from an unknown one to English', () => {
        expect(mount(Form, { props: { schema: schemaWith([dateField], { locale: 'nl-BE' }) } }).text()).toContain('Kies datum')
        expect(mount(Form, { props: { schema: schemaWith([dateField], { locale: 'xx' }) } }).text()).toContain('Pick a date')
    })

    it('lets the locale prop win over the schema and a global locale', () => {
        configureFormMessages({ locale: 'nl' })

        const wrapper = mount(Form, { props: { schema: schemaWith([dateField], { locale: 'nl' }), locale: 'en' } })

        expect(wrapper.text()).toContain('Pick a date')
    })

    it('lets a global locale win over the schema', () => {
        configureFormMessages({ locale: 'nl' })

        expect(mount(Form, { props: { schema: schemaWith([dateField], { locale: 'en' }) } }).text()).toContain('Kies datum')
    })

    it('registers a new locale and overrides single messages', () => {
        configureFormMessages({ messages: { de: { pickDate: 'Datum wählen' } } })

        expect(mount(Form, { props: { schema: schemaWith([dateField]), locale: 'de' } }).text()).toContain('Datum wählen')
        expect(mount(Form, { props: { schema: schemaWith([dateField]), messages: { pickDate: 'When?' } } }).text()).toContain('When?')
    })

    it('keeps a placeholder from the schema above every message', () => {
        const wrapper = mount(Form, { props: { schema: schemaWith([{ ...dateField, placeholder: 'Arrival' }]) } })

        expect(wrapper.text()).toContain('Arrival')
    })

    it('translates components used outside a form through the global locale', () => {
        configureFormMessages({ locale: 'nl' })

        const wrapper = mount(SortableList, { props: { modelValue: [{ id: 1 }, { id: 2 }] } })

        expect(wrapper.find('button[aria-label="Omlaag"]').exists()).toBe(true)
    })
})
