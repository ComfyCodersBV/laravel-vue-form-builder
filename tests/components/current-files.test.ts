import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Form from '../../resources/js/components/Form.vue'

const attachments = {
    name: 'attachments',
    type: 'file',
    multiple: true,
    removeFlag: 'remove_attachments',
    currentFiles: [
        { key: '0', name: 'offerte.pdf', size: 81234, url: 'https://cdn.test/offerte.pdf' },
        { key: '1', name: 'logo.png' },
    ],
}

const schemaWith = (field: Record<string, unknown>) => ({
    schemaVersion: '1.8',
    id: 'files',
    action: '/',
    method: 'post',
    defaults: {},
    fields: [field],
})

const formOf = (wrapper: ReturnType<typeof mount>): any => (wrapper.vm as any).form

describe('file field with a list of current files', () => {
    it('lists the current files above the upload input', () => {
        const wrapper = mount(Form, { props: { schema: schemaWith(attachments) } })

        const items = wrapper.findAll('[data-current-file-item]')

        expect(items).toHaveLength(2)
        expect(items[0].find('a').attributes('href')).toBe('https://cdn.test/offerte.pdf')
        expect(items[0].text()).toContain('79.3 KB')
        expect(items[1].text()).toContain('logo.png')
        expect(wrapper.html().indexOf('data-current-files')).toBeLessThan(wrapper.html().indexOf('type="file"'))
        expect(wrapper.find('[data-current-file]').exists()).toBe(false)
    })

    it('collects the keys of the files to remove', async () => {
        const wrapper = mount(Form, { props: { schema: schemaWith(attachments) } })

        expect(formOf(wrapper).remove_attachments).toEqual([])

        const toggles = wrapper.findAll('[data-current-file-item] input[type="checkbox"]')

        await toggles[1].setValue(true)
        await toggles[0].setValue(true)

        expect(formOf(wrapper).remove_attachments).toEqual(['1', '0'])
        expect(wrapper.findAll('input[type="hidden"][name="remove_attachments[]"]').map((input) => input.attributes('value'))).toEqual(['1', '0'])

        await toggles[1].setValue(false)

        expect(formOf(wrapper).remove_attachments).toEqual(['0'])
        expect(wrapper.findAll('[data-current-file-item]')[0].attributes()).toHaveProperty('data-removing')
    })

    it('offers no remove toggles without a remove flag', () => {
        const wrapper = mount(Form, { props: { schema: schemaWith({ ...attachments, removeFlag: undefined }) } })

        expect(wrapper.findAll('[data-current-file-item]')).toHaveLength(2)
        expect(wrapper.find('[data-current-file-item] input[type="checkbox"]').exists()).toBe(false)
    })
})
