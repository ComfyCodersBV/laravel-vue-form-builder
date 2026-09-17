import {describe, expect, it} from 'vitest'
import {mount} from '@vue/test-utils'
import ColorField from '../../resources/js/components/Fields/ColorField.vue'
import SortableList from '../../resources/js/components/SortableList.vue'
import TreeView from '../../resources/js/components/TreeView.vue'
import Tabs from '../../resources/js/components/Tabs.vue'

describe('ColorField', () => {
    it('keeps the picker on a valid colour when the text value is incomplete', () => {
        const wrapper = mount(ColorField, {props: {name: 'color', modelValue: '#ab'}})

        expect(wrapper.get('input[type="color"]').attributes('value')).toBe('#000000')
    })

    it('emits the swatch that was clicked', async () => {
        const wrapper = mount(ColorField, {
            props: {name: 'color', modelValue: '#ffffff', swatches: ['#ff0000', '#00ff00']},
        })

        await wrapper.findAll('button[aria-label]')[1].trigger('click')

        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['#00ff00'])
    })

    it('does not change value through a swatch while readonly', async () => {
        const wrapper = mount(ColorField, {
            props: {name: 'color', modelValue: '#ffffff', swatches: ['#ff0000'], readonly: true},
        })

        await wrapper.get('button[aria-label="#ff0000"]').trigger('click')

        expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })
})

describe('SortableList', () => {
    const items = [{id: 1, label: 'one'}, {id: 2, label: 'two'}, {id: 3, label: 'three'}]

    it('moves an item down and emits the reordered list', async () => {
        const wrapper = mount(SortableList, {props: {modelValue: items}})

        await wrapper.findAll('button[aria-label="Move down"]')[0].trigger('click')

        expect(wrapper.emitted('update:modelValue')?.[0][0]).toEqual([items[1], items[0], items[2]])
        expect(wrapper.emitted('reorder')?.[0][0]).toMatchObject({from: 0, to: 1})
    })

    it('disables moving the first item up and the last item down', () => {
        const wrapper = mount(SortableList, {props: {modelValue: items}})

        const up = wrapper.findAll('button[aria-label="Move up"]')
        const down = wrapper.findAll('button[aria-label="Move down"]')

        expect(up[0].attributes('disabled')).toBeDefined()
        expect(down[2].attributes('disabled')).toBeDefined()
    })
})

describe('TreeView', () => {
    const nodes = [
        {id: 1, label: 'Furniture', children: [{id: 2, label: 'Chairs'}]},
        {id: 3, label: 'Storage'},
    ]

    it('hides children until the node is expanded', async () => {
        const wrapper = mount(TreeView, {props: {nodes}})

        expect(wrapper.text()).not.toContain('Chairs')

        await wrapper.get('button[aria-label="Expand"]').trigger('click')

        expect(wrapper.text()).toContain('Chairs')
    })

    it('emits the selected node id', async () => {
        const wrapper = mount(TreeView, {props: {nodes}})

        await wrapper.findAll('button')[2].trigger('click')

        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([3])
    })
})

describe('Tabs', () => {
    const tabs = [
        {key: 'overview', label: 'Overview'},
        {key: 'brand-12', label: 'Acme', closable: true, dirty: true},
    ]

    it('emits close for a closable tab without switching to it', async () => {
        const wrapper = mount(Tabs, {props: {tabs, modelValue: 'overview'}})

        await wrapper.get('button[aria-label="Close Acme"]').trigger('click')

        expect(wrapper.emitted('close')?.[0][0]).toMatchObject({key: 'brand-12'})
        expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('marks a dirty tab and does not re-emit the active tab', async () => {
        const wrapper = mount(Tabs, {props: {tabs, modelValue: 'overview'}})

        expect(wrapper.get('[aria-label="Unsaved changes"]').exists()).toBe(true)

        await wrapper.findAll('[role="tab"] button')[0].trigger('click')

        expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })
})
