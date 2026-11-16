import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import Form from '../../resources/js/components/Form.vue'

const schemaWith = (fields: Record<string, unknown>[], extra: Record<string, unknown> = {}) => ({
    schemaVersion: '1.16',
    id: 'errors',
    action: '/tags',
    method: 'post',
    defaults: {},
    fields,
    ...extra,
})

const formOf = (wrapper: ReturnType<typeof mount>): any => (wrapper.vm as any).form

describe('errors of array elements', () => {
    it('shows the error of an element at its field and not above the form', async () => {
        const wrapper = mount(Form, {
            props: { schema: schemaWith([{ name: 'ids', type: 'checkboxes', label: 'Ids', options: { 1: 'One' } }]) },
        })

        formOf(wrapper).setError({ 'ids.0': 'The selected id is invalid.' })
        await nextTick()

        expect(wrapper.find('[data-form-errors]').exists()).toBe(false)
        expect(wrapper.text()).toContain('The selected id is invalid.')
    })

    it('prefers the error of the field itself', async () => {
        const wrapper = mount(Form, { props: { schema: schemaWith([{ name: 'ids', type: 'select', multiple: true, options: { 1: 'One' } }]) } })

        formOf(wrapper).setError({ ids: 'Pick at most one.', 'ids.0': 'The selected id is invalid.' })
        await nextTick()

        expect(wrapper.text()).toContain('Pick at most one.')
        expect(wrapper.text()).not.toContain('The selected id is invalid.')
    })

    it('shows the error of the start of a period at the date field', async () => {
        const wrapper = mount(Form, { props: { schema: schemaWith([{ name: 'period', type: 'date', range: true }]) } })

        formOf(wrapper).setError({ 'period.start': 'The start is required.' })
        await nextTick()

        expect(wrapper.text()).toContain('The start is required.')
        expect(wrapper.find('[data-form-errors]').exists()).toBe(false)
    })

    it('shows the element error of a field inside a repeater row at that field', async () => {
        const wrapper = mount(Form, {
            props: {
                schema: schemaWith(
                    [{ name: 'lines', type: 'repeater', fields: [{ name: 'codes', type: 'checkboxes', options: { a: 'A' } }] }],
                    { defaults: { lines: [{ codes: [] }, { codes: ['a'] }] } },
                ),
            },
        })

        formOf(wrapper).setError({ 'lines.1.codes.0': 'The code is invalid.' })
        await nextTick()

        const rows = wrapper.findAll('[data-repeater-row]')

        expect(rows[0]!.text()).not.toContain('The code is invalid.')
        expect(rows[1]!.text()).toContain('The code is invalid.')
        expect(wrapper.find('[data-form-errors]').exists()).toBe(false)
    })
})
