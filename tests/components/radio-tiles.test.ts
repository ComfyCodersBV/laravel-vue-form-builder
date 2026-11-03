import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import Form from '../../resources/js/components/Form.vue'

const schemaWith = (field: Record<string, unknown>) => ({
    schemaVersion: '1.11',
    id: 'tiles',
    action: '/',
    method: 'post',
    defaults: {},
    fields: [field],
})

const units = [
    { value: 1, label: 'Main hall', description: 'Up to 120 people' },
    { value: 2, label: 'Attic', description: 'Up to 20 people' },
    { value: 3, label: 'Cellar', disabled: true },
]

function tilesForm(field: Record<string, unknown> = {}) {
    return mount(Form, {
        attachTo: document.body,
        props: { schema: schemaWith({ name: 'unit', type: 'radio', tiles: true, options: units, ...field }) },
    })
}

afterEach(() => {
    document.body.innerHTML = ''
})

describe('radio tiles', () => {
    it('renders each option as a tile with its description', () => {
        const wrapper = tilesForm()

        expect(wrapper.findAll('[data-option-tile]')).toHaveLength(3)
        expect(wrapper.find('[data-option="1"]').text()).toContain('Main hall')
        expect(wrapper.find('[data-option="1"]').text()).toContain('Up to 120 people')
        expect(wrapper.find('[data-option="1"] [data-option-tile]').attributes('aria-describedby')).toBe('unit-1-description')
    })

    it('selects an option when its tile is clicked', async () => {
        const wrapper = tilesForm()

        await wrapper.find('[data-option="2"] [data-option-tile]').trigger('click')

        expect((wrapper.vm as any).form.unit).toBe(2)
        expect(wrapper.find('[data-option="2"]').attributes('data-selected')).toBe('')
        expect(wrapper.find('[data-option="2"] [data-option-tile]').attributes('aria-checked')).toBe('true')
        expect(wrapper.find('[data-option="1"]').attributes('data-selected')).toBeUndefined()
    })

    it('does not select a disabled option', async () => {
        const wrapper = tilesForm()

        expect(wrapper.find('[data-option="3"] [data-option-tile]').attributes('disabled')).toBeDefined()

        await wrapper.find('[data-option="3"] [data-option-tile]').trigger('click')

        expect((wrapper.vm as any).form.unit).toBe('')
    })

    it('moves the choice with the arrow keys like a radio group', async () => {
        const wrapper = tilesForm({ default: 1 })

        const first = wrapper.find('[data-option="1"] [data-option-tile]')
        ;(first.element as HTMLElement).focus()
        await first.trigger('focus')
        await first.trigger('keydown', { key: 'ArrowDown' })
        await new Promise((resolve) => setTimeout(resolve, 0))
        await nextTick()

        expect(document.activeElement).toBe(wrapper.find('[data-option="2"] [data-option-tile]').element)
        expect((wrapper.vm as any).form.unit).toBe(2)
    })

    it('keeps the plain radios without tiles', () => {
        const wrapper = tilesForm({ tiles: false })

        expect(wrapper.find('[data-option-tile]').exists()).toBe(false)
        expect(wrapper.findAll('[data-option]')).toHaveLength(3)
    })
})
