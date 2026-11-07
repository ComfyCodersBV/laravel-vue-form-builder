import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import Form from '../../resources/js/components/Form.vue'

const schemaWith = (fields: Array<Record<string, unknown>>, defaults: Record<string, unknown> = {}) => ({
    schemaVersion: '1.13',
    id: 'entries',
    action: '/',
    method: 'post',
    defaults,
    fields,
})

const formOf = (wrapper: ReturnType<typeof mount>): any => (wrapper.vm as any).form

describe('errors of entries', () => {
    it('shows the errors of single files under a files field', async () => {
        const wrapper = mount(Form, { props: { schema: schemaWith([{ name: 'files', type: 'file', multiple: true }]) } })

        formOf(wrapper).setError({
            'files.0': 'report.exe is not allowed.',
            'files.2': 'huge.pdf is too large.',
        })
        await nextTick()

        expect(wrapper.text()).toContain('report.exe is not allowed. huge.pdf is too large.')
        expect(wrapper.find('[data-form-errors]').exists()).toBe(false)
    })

    it('prefers the error of the files field itself', async () => {
        const wrapper = mount(Form, { props: { schema: schemaWith([{ name: 'files', type: 'file', multiple: true }]) } })

        formOf(wrapper).setError({
            files: 'Upload at most 10 files.',
            'files.0': 'report.exe is not allowed.',
        })
        await nextTick()

        expect(wrapper.text()).toContain('Upload at most 10 files.')
        expect(wrapper.text()).not.toContain('report.exe')
    })

    it('shows the errors of a repeater row under its sub-field', async () => {
        const wrapper = mount(Form, {
            props: {
                schema: schemaWith(
                    [{ name: 'lines', type: 'repeater', fields: [{ name: 'amount', type: 'text' }] }],
                    { lines: [{ amount: '1' }, { amount: '' }] },
                ),
            },
        })

        formOf(wrapper).setError({ 'lines.1.amount': 'The amount is required.' })
        await nextTick()

        const rows = wrapper.findAll('[data-repeater-row]')

        expect(rows[0].text()).not.toContain('The amount is required.')
        expect(rows[1].text()).toContain('The amount is required.')
    })
})

describe('inline repeater', () => {
    it('puts the sub-fields of a row next to each other', () => {
        const wrapper = mount(Form, {
            props: {
                schema: schemaWith(
                    [{ name: 'members', type: 'repeater', inline: true, fields: [{ name: 'user_id', type: 'text', label: 'Member' }, { name: 'role', type: 'text', label: 'Role' }] }],
                    { members: [{ user_id: '1', role: 'x' }] },
                ),
            },
        })

        const row = wrapper.find('[data-repeater-row]')
        const grid = row.find('.sm\\:grid-flow-col')

        expect(grid.findAll('input')).toHaveLength(2)
        expect(grid.element.children).toHaveLength(2)
        expect(row.text()).not.toContain('#1')
    })
})
