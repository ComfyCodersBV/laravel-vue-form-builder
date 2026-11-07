import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import Form from '../../resources/js/components/Form.vue'
import { toOptions } from '../../resources/js/lib/options'

const schemaWith = (fields: Array<Record<string, unknown>>, defaults: Record<string, unknown> = {}) => ({
    schemaVersion: '1.13',
    id: 'options',
    action: '/',
    method: 'post',
    defaults,
    fields,
})

const formOf = (wrapper: ReturnType<typeof mount>): any => (wrapper.vm as any).form

async function open(wrapper: ReturnType<typeof mount>, name: string): Promise<void> {
    await wrapper.find(`button[id="${name}"]`).trigger('click')
    await flushPromises()
}

function optionLabels(): string[] {
    return Array.from(document.body.querySelectorAll<HTMLButtonElement>('.max-h-64 button')).map((button) => button.textContent?.trim() ?? '')
}

function groupLabels(): string[] {
    return Array.from(document.body.querySelectorAll('[data-select-group]')).map((group) => group.textContent?.trim() ?? '')
}

describe('select options', () => {
    beforeEach(() => {
        vi.stubGlobal('ResizeObserver', class {
            observe(): void {}
            unobserve(): void {}
            disconnect(): void {}
        })
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        document.body.innerHTML = ''
    })

    it('keeps the server order of options given as a map', () => {
        expect(toOptions({ 3: 'Bram', 12: 'Anna' }, 'name', 'id', ['12', '3']).map((option) => option.label)).toEqual(['Anna', 'Bram'])
        expect(toOptions({ 3: 'Bram', 12: 'Anna' }, 'name', 'id').map((option) => option.label)).toEqual(['Bram', 'Anna'])
    })

    it('shows options in the order the server sent', async () => {
        const wrapper = mount(Form, {
            attachTo: document.body,
            props: {
                schema: schemaWith([{ name: 'renter_id', type: 'select', searchable: true, options: { 3: 'Bram', 12: 'Anna' }, optionOrder: ['12', '3'] }]),
            },
        })

        await open(wrapper, 'renter_id')

        expect(optionLabels()).toEqual(['Anna', 'Bram'])
    })

    it('shows grouped options under their group', async () => {
        const wrapper = mount(Form, {
            attachTo: document.body,
            props: {
                schema: schemaWith([{
                    name: 'post_id',
                    type: 'select',
                    searchable: true,
                    options: [
                        { id: '7', name: 'Rent', group: 'Costs' },
                        { id: '2', name: 'Energy', group: 'Costs' },
                        { id: '9', name: 'Bar', group: 'Income' },
                    ],
                }]),
            },
        })

        await open(wrapper, 'post_id')

        expect(groupLabels()).toEqual(['Costs', 'Income'])
        expect(optionLabels()).toEqual(['Rent', 'Energy', 'Bar'])
    })

    it('shows the options of the value it depends on and clears a choice that is gone', async () => {
        const wrapper = mount(Form, {
            attachTo: document.body,
            props: {
                schema: schemaWith([
                    { name: 'direction', type: 'text' },
                    {
                        name: 'post_id',
                        type: 'select',
                        searchable: true,
                        dependentOptions: {
                            field: 'direction',
                            options: {
                                expense: [{ id: '7', name: 'Rent' }],
                                income: [{ id: '9', name: 'Bar' }, { id: '7', name: 'Rent' }],
                            },
                        },
                    },
                ], { direction: 'income', post_id: '9' }),
            },
        })

        expect(wrapper.find('button[id="post_id"]').text()).toContain('Bar')

        await open(wrapper, 'post_id')
        expect(optionLabels()).toEqual(['Bar', 'Rent'])

        formOf(wrapper).direction = 'expense'
        await nextTick()
        await flushPromises()

        expect(formOf(wrapper).post_id).toBe('')

        formOf(wrapper).post_id = '7'
        formOf(wrapper).direction = 'income'
        await nextTick()
        await flushPromises()

        expect(formOf(wrapper).post_id).toBe('7')
    })
})
