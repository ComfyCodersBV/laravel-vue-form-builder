import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import Form from '../../resources/js/components/Form.vue'
import { dependentOptionsFor, toOptions } from '../../resources/js/lib/options'

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

function optionCodes(): string[] {
    return Array.from(document.body.querySelectorAll('.max-h-64 button [data-option-code]')).map((code) => code.textContent ?? '')
}

async function search(text: string): Promise<void> {
    const input = document.body.querySelector('[data-slot="popover-content"] input, [role="dialog"] input') as HTMLInputElement

    input.value = text
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
}

const financePosts = [
    { id: '8010', name: 'Rent to individuals', code: '8010', group: 'Income' },
    { id: '8020', name: 'Rent to <b>clubs</b>', code: '8020', group: 'Income' },
    { id: '1', name: 'Other income', group: 'Income' },
    { id: '4100', name: 'Energy', code: '4100', group: 'Costs' },
]

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

    it('reads a boolean value it depends on as 1 or 0', () => {
        const dependent = { field: 'member', options: { 1: ['member'], 0: ['guest'] } }

        expect(dependentOptionsFor(dependent, true)).toEqual(['member'])
        expect(dependentOptionsFor(dependent, false)).toEqual(['guest'])
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

    it('shows the code of each option in its own column, also an empty one', async () => {
        const wrapper = mount(Form, {
            attachTo: document.body,
            props: {
                schema: schemaWith([{ name: 'post_id', type: 'select', searchable: true, optionCode: 'code', options: financePosts }]),
            },
        })

        await open(wrapper, 'post_id')

        expect(groupLabels()).toEqual(['Income', 'Costs'])
        expect(optionCodes()).toEqual(['8010', '8020', '', '4100'])
        expect(optionLabels()).toEqual(['8010Rent to individuals', '8020Rent to clubs', 'Other income', '4100Energy'])

        const widths = Array.from(document.body.querySelectorAll<HTMLElement>('.max-h-64 button [data-option-code]')).map((code) => code.style.minWidth)

        expect(new Set(widths)).toEqual(new Set(['4ch']))
    })

    it('searches on the code and on the label text, not on its markup', async () => {
        const wrapper = mount(Form, {
            attachTo: document.body,
            props: {
                schema: schemaWith([{ name: 'post_id', type: 'select', searchable: true, optionCode: 'code', options: financePosts }]),
            },
        })

        await open(wrapper, 'post_id')

        await search('80')
        expect(optionCodes()).toEqual(['8010', '8020'])

        await search('8010 rent')
        expect(optionCodes()).toEqual(['8010'])

        await search('rent 80')
        expect(optionCodes()).toEqual(['8010', '8020'])

        await search('8020 clubs')
        expect(optionCodes()).toEqual(['8020'])

        await search('clubs')
        expect(optionCodes()).toEqual(['8020'])

        await search('<b>')
        expect(optionCodes()).toEqual([])
    })

    it('shows the code with the label of the chosen option', () => {
        const wrapper = mount(Form, {
            attachTo: document.body,
            props: {
                schema: schemaWith([
                    { name: 'post_id', type: 'select', searchable: true, optionCode: 'code', options: financePosts },
                    { name: 'plain_id', type: 'select', optionCode: 'code', options: financePosts },
                ], { post_id: '8010', plain_id: '4100' }),
            },
        })

        expect(wrapper.find('button[id="post_id"] [data-option-code]').text()).toBe('8010')
        expect(wrapper.find('button[id="post_id"]').text()).toContain('Rent to individuals')
        expect(wrapper.find('button[id="plain_id"] [data-option-code]').text()).toBe('4100')
        expect(wrapper.find('button[id="plain_id"]').text()).toContain('Energy')
    })

    it('renders a code as text', async () => {
        const wrapper = mount(Form, {
            attachTo: document.body,
            props: {
                schema: schemaWith([{
                    name: 'post_id',
                    type: 'select',
                    searchable: true,
                    optionCode: 'code',
                    options: [{ id: '1', name: 'Rent', code: '<i>80</i>' }],
                }]),
            },
        })

        await open(wrapper, 'post_id')

        expect(optionCodes()).toEqual(['<i>80</i>'])
        expect(document.body.querySelector('.max-h-64 i')).toBeNull()
    })

    it('ignores a code key unless the field names it', async () => {
        const wrapper = mount(Form, {
            attachTo: document.body,
            props: {
                schema: schemaWith([{ name: 'post_id', type: 'select', searchable: true, options: financePosts }]),
            },
        })

        await open(wrapper, 'post_id')

        expect(optionCodes()).toEqual([])
        expect(optionLabels()[0]).toBe('Rent to individuals')
    })

    it('shows the code of dependent options', async () => {
        const wrapper = mount(Form, {
            attachTo: document.body,
            props: {
                schema: schemaWith([
                    { name: 'direction', type: 'text' },
                    {
                        name: 'post_id',
                        type: 'select',
                        searchable: true,
                        optionCode: 'number',
                        dependentOptions: {
                            field: 'direction',
                            options: { income: [{ id: '9', name: 'Bar', number: 8100 }] },
                        },
                    },
                ], { direction: 'income' }),
            },
        })

        await open(wrapper, 'post_id')

        expect(optionCodes()).toEqual(['8100'])
    })

    it('shows and searches the code in a multi-select', async () => {
        const wrapper = mount(Form, {
            attachTo: document.body,
            props: {
                schema: schemaWith([{ name: 'posts', type: 'select', multiple: true, optionCode: 'code', options: financePosts }], { posts: ['4100'] }),
            },
        })

        expect(wrapper.text()).toContain('4100 Energy')

        await wrapper.find('button[type="button"]').trigger('click')
        await flushPromises()
        await search('rent 8020')

        expect(optionCodes()).toEqual(['8020'])
    })
})
