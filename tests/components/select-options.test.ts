import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
})
