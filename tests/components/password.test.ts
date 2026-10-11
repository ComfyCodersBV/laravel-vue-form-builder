import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Form from '../../resources/js/components/Form.vue'

const schemaWith = (field: Record<string, unknown>) => ({
    schemaVersion: '1.5',
    id: 'password',
    action: '/',
    method: 'post',
    defaults: {},
    fields: [{ name: 'api_key', type: 'password', label: 'API key', ...field }],
})

const formOf = (wrapper: ReturnType<typeof mount>): any => (wrapper.vm as any).form

describe('password with a stored value', () => {
    it('says a value is stored and masks the placeholder', () => {
        const wrapper = mount(Form, { props: { schema: schemaWith({ stored: true }) } })

        expect(wrapper.find('[data-stored-value]').text()).toContain('A value is stored')
        expect(wrapper.find('input#api_key').attributes('placeholder')).toBe('••••••••')
        expect(formOf(wrapper).api_key).toBe('')
    })

    it('keeps its own placeholder', () => {
        const wrapper = mount(Form, { props: { schema: schemaWith({ stored: true, placeholder: 'Paste a new key' }) } })

        expect(wrapper.find('input#api_key').attributes('placeholder')).toBe('Paste a new key')
    })

    it('says nothing when no value is stored', () => {
        const wrapper = mount(Form, { props: { schema: schemaWith({}) } })

        expect(wrapper.find('[data-stored-value]').exists()).toBe(false)
    })

    it('submits the remove flag', async () => {
        const wrapper = mount(Form, { props: { schema: schemaWith({ stored: true, removeFlag: 'remove_api_key' }) } })

        expect(formOf(wrapper).remove_api_key).toBe(false)

        await wrapper.find('[data-stored-value] input[type="checkbox"]').setValue(true)

        expect(formOf(wrapper).remove_api_key).toBe(true)
        expect(wrapper.find('input[type="hidden"][name="remove_api_key"]').attributes('value')).toBe('1')
    })

    it('speaks Dutch with a Dutch form', () => {
        const wrapper = mount(Form, { props: { schema: { ...schemaWith({ stored: true }), locale: 'nl' } } })

        expect(wrapper.find('[data-stored-value]').text()).toContain('Er is een waarde opgeslagen')
    })
})
