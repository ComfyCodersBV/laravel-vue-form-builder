import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import Form from '../../resources/js/components/Form.vue'

const schemaWith = (fields: Record<string, unknown>[], extra: Record<string, unknown> = {}) => ({
    schemaVersion: '1.18',
    id: 'order',
    action: '/',
    method: 'post',
    defaults: { token: 'abc' },
    fields,
    ...extra,
})

const pair = [
    { name: 'first', type: 'text', label: 'First' },
    { name: 'token', type: 'hidden' },
    { name: 'last', type: 'text', label: 'Last' },
]

const formOf = (wrapper: ReturnType<typeof mount>): any => (wrapper.vm as any).form

describe('hidden fields', () => {
    it('take no cell in a grid, so the fields around them share a row', () => {
        const wrapper = mount(Form, { props: { schema: schemaWith(pair, { columns: 2 }) } })

        const grid = wrapper.find('form > .grid')
        const cells = grid.element.children

        expect(cells).toHaveLength(2)
        expect([...cells].every((cell) => cell.className === '')).toBe(true)
        expect(grid.find('input[type="hidden"]').exists()).toBe(false)
        expect((wrapper.find('input[name="token"]').element as HTMLInputElement).value).toBe('abc')
    })

    it('add no element to a stacked form', () => {
        const wrapper = mount(Form, { props: { schema: schemaWith(pair) } })

        const stack = wrapper.find('form > .space-y-4')

        expect(stack.element.children).toHaveLength(2)
        expect(wrapper.find('input[name="token"]').exists()).toBe(true)
    })

    it('stay out of the grid of a section', () => {
        const wrapper = mount(Form, {
            props: { schema: schemaWith([{ type: 'section', title: 'Names', columns: 2, fields: pair }]) },
        })

        expect(wrapper.find('[data-form-section] .grid').element.children).toHaveLength(2)
        expect(wrapper.find('[data-form-section] input[name="token"]').exists()).toBe(true)
    })

    it('stay out of the cells of a wizard step', () => {
        const wrapper = mount(Form, {
            props: {
                schema: schemaWith([
                    { type: 'step', name: 'names', title: 'Names', fields: pair },
                    { type: 'step', name: 'notes', title: 'Notes', fields: [{ name: 'notes', type: 'text' }] },
                ], { columns: 2 }),
            },
        })

        expect(wrapper.find('form .grid').element.children).toHaveLength(2)
        expect(wrapper.find('input[name="token"]').exists()).toBe(true)
    })

    it('add no element to a repeater row', () => {
        const wrapper = mount(Form, {
            props: {
                schema: {
                    ...schemaWith([{ name: 'lines', type: 'repeater', fields: pair }]),
                    defaults: { lines: [{ first: 'a', token: 'abc', last: 'b' }] },
                },
            },
        })

        const row = wrapper.find('[data-repeater-row]')

        expect(row.findAll('input[type="hidden"][name="token"]')).toHaveLength(1)
        expect(row.find('input[type="hidden"][name="token"]').element.parentElement!.querySelector('#order-lines-0-first')).not.toBeNull()
    })

    it('render no empty grid when every field is hidden', () => {
        const wrapper = mount(Form, { props: { schema: schemaWith([{ name: 'token', type: 'hidden' }], { columns: 2 }) } })

        expect(wrapper.find('.grid').exists()).toBe(false)
        expect(wrapper.find('input[name="token"]').exists()).toBe(true)
    })

    it('still show their error', async () => {
        const wrapper = mount(Form, { props: { schema: schemaWith(pair, { columns: 2 }) } })

        formOf(wrapper).setError({ token: 'Expired.' })
        await nextTick()

        expect(wrapper.text()).toContain('Expired.')
    })
})
