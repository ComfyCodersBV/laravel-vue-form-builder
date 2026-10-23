import {describe, expect, it} from 'vitest'
import {defineComponent, h} from 'vue'
import {mount} from '@vue/test-utils'
import ColorField from '../../resources/js/components/Fields/ColorField.vue'
import SortableList from '../../resources/js/components/SortableList.vue'
import TreeView from '../../resources/js/components/TreeView.vue'
import DateField from '../../resources/js/components/Fields/DateField.vue'
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

describe('DateField', () => {
    it('renders the trigger with the requested pattern instead of the browser default', () => {
        const wrapper = mount(DateField, {
            props: {name: 'from_date', modelValue: '2026-12-20', format: 'DD-MM-YYYY'},
        })

        expect(wrapper.text()).toContain('20-12-2026')
    })

    it('falls back to the given locale when no pattern is set', () => {
        const wrapper = mount(DateField, {
            props: {name: 'from_date', modelValue: '2026-12-20', locale: 'nl-NL'},
        })

        expect(wrapper.text()).toContain('20-12-2026')
    })
})

describe('TreeView dragging', () => {
    const nodes = [
        {id: 'main', label: 'main', draggable: false, children: [{id: 'shop', label: 'Shop', children: [{id: 'chairs', label: 'Chairs'}]}]},
        {id: 'footer', label: 'footer', draggable: false},
    ]

    function dataTransfer(): DataTransfer {
        return {setData: () => {}} as unknown as DataTransfer
    }

    async function dragOnto(wrapper: ReturnType<typeof mount>, from: string, to: string): Promise<void> {
        const source = wrapper.get(`[data-tree-node="${from}"]`)
        const target = wrapper.get(`[data-tree-node="${to}"]`)

        target.element.getBoundingClientRect = () => ({top: 0, height: 20} as DOMRect)

        await source.trigger('dragstart', {dataTransfer: dataTransfer()})
        await target.trigger('dragover', {clientY: 10})
        await target.trigger('drop')
    }

    it('drops a nested node onto a node of another level', async () => {
        const wrapper = mount(TreeView, {props: {nodes, draggable: true, expandedIds: ['main', 'shop']}})

        await dragOnto(wrapper, 'chairs', 'footer')

        expect(wrapper.emitted('drop')?.[0][0]).toMatchObject({dragged: {id: 'chairs'}, target: {id: 'footer'}, position: 'inside'})
    })

    it('keeps a node that is not draggable in place', () => {
        const wrapper = mount(TreeView, {props: {nodes, draggable: true}})

        expect(wrapper.get('[data-tree-node="main"]').attributes('draggable')).toBe('false')
    })

    it('refuses to drop a node into its own descendant', async () => {
        const wrapper = mount(TreeView, {props: {nodes, draggable: true, expandedIds: ['main', 'shop']}})

        await dragOnto(wrapper, 'shop', 'chairs')

        expect(wrapper.emitted('drop')).toBeUndefined()
    })
})

describe('TreeView inside another tree', () => {
    it('keeps its own drag state when it is rendered in the actions slot of an outer tree', async () => {
        const inner = defineComponent({
            setup: () => () => h(TreeView, {nodes: [{id: 'x', label: 'X'}, {id: 'y', label: 'Y'}], draggable: true}),
        })
        const wrapper = mount(TreeView, {
            props: {nodes: [{id: 'outer', label: 'Outer'}], draggable: true},
            slots: {actions: () => h(inner)},
        })

        await wrapper.get('[data-tree-node="outer"]').trigger('dragstart', {dataTransfer: {setData: () => {}}})

        const target = wrapper.get('[data-tree-node="y"]')
        target.element.getBoundingClientRect = () => ({top: 0, height: 20} as DOMRect)
        await target.trigger('dragover', {clientY: 10})
        await target.trigger('drop')

        expect(wrapper.findComponent(inner).findComponent(TreeView).emitted('drop')).toBeUndefined()
    })
})

describe('TreeView external drops', () => {
    const nodes = [{id: 'root', label: 'Root', draggable: false, children: [{id: 'chairs', label: 'Chairs'}]}]

    function externalTransfer(type: string, payload: string): DataTransfer {
        return {types: [type], getData: (asked: string) => (asked === type ? payload : '')} as unknown as DataTransfer
    }

    async function dropOn(wrapper: ReturnType<typeof mount>, id: string, dataTransfer: DataTransfer): Promise<void> {
        const target = wrapper.get(`[data-tree-node="${id}"]`)

        target.element.getBoundingClientRect = () => ({top: 0, height: 20} as DOMRect)

        await target.trigger('dragover', {clientY: 10, dataTransfer})
        await target.trigger('drop', {dataTransfer})
    }

    it('accepts an item of the external type dropped on a nested node', async () => {
        const wrapper = mount(TreeView, {props: {nodes, draggable: true, expandedIds: ['root'], externalType: 'application/x-category'}})

        await dropOn(wrapper, 'chairs', externalTransfer('application/x-category', '{"id":"c9","label":"Tables"}'))

        expect(wrapper.emitted('external-drop')?.[0][0]).toEqual({data: {id: 'c9', label: 'Tables'}, target: expect.objectContaining({id: 'chairs'}), position: 'inside'})
        expect(wrapper.emitted('drop')).toBeUndefined()
    })

    it('ignores other drags and trees without an external type', async () => {
        const typed = mount(TreeView, {props: {nodes, draggable: true, expandedIds: ['root'], externalType: 'application/x-category'}})
        const untyped = mount(TreeView, {props: {nodes, draggable: true, expandedIds: ['root']}})

        await dropOn(typed, 'root', externalTransfer('text/plain', 'hello'))
        await dropOn(untyped, 'root', externalTransfer('application/x-category', '{"id":"c9"}'))

        expect(typed.emitted('external-drop')).toBeUndefined()
        expect(untyped.emitted('external-drop')).toBeUndefined()
    })
})
