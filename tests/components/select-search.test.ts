import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import Form from '../../resources/js/components/Form.vue'

const schemaWith = (defaults: Record<string, unknown> = {}) => ({
    schemaVersion: '1.8',
    id: 'remote',
    action: '/',
    method: 'post',
    defaults,
    fields: [{ name: 'brand_id', type: 'select', label: 'Brand', options: [] }],
})

const formOf = (wrapper: ReturnType<typeof mount>): any => (wrapper.vm as any).form

async function open(wrapper: ReturnType<typeof mount>): Promise<HTMLInputElement> {
    await wrapper.find('button[id="brand_id"]').trigger('click')
    await flushPromises()

    return document.body.querySelector('[data-slot="popover-content"] input, [role="dialog"] input') as HTMLInputElement
}

async function type(input: HTMLInputElement, text: string): Promise<void> {
    input.value = text
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
}

function optionButtons(): HTMLButtonElement[] {
    return Array.from(document.body.querySelectorAll<HTMLButtonElement>('.max-h-64 button'))
}

describe('select with a remote search', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.stubGlobal('ResizeObserver', class {
            observe(): void {}
            unobserve(): void {}
            disconnect(): void {}
        })
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.unstubAllGlobals()
        document.body.innerHTML = ''
    })

    it('asks the search function for options once the minimum length is typed', async () => {
        const search = vi.fn().mockResolvedValue([{ id: 'b1', name: '12 - Acme' }])
        const wrapper = mount(Form, {
            attachTo: document.body,
            props: { schema: schemaWith(), fieldOverrides: { brand_id: { search, minSearchLength: 2 } } },
        })

        const input = await open(wrapper)

        await type(input, 'a')
        await vi.advanceTimersByTimeAsync(300)
        expect(search).not.toHaveBeenCalled()

        await type(input, 'ac')
        await vi.advanceTimersByTimeAsync(300)
        await flushPromises()

        expect(search).toHaveBeenCalledWith('ac')
        expect(optionButtons().map((button) => button.textContent?.trim())).toEqual(['12 - Acme'])

        optionButtons()[0].click()
        await flushPromises()

        expect(formOf(wrapper).brand_id).toBe('b1')
        expect(wrapper.find('button[id="brand_id"]').text()).toContain('12 - Acme')
    })

    it('keeps a stored value that is not among the results and shows its selected label', async () => {
        const wrapper = mount(Form, {
            attachTo: document.body,
            props: {
                schema: schemaWith({ brand_id: 'b9' }),
                fieldOverrides: { brand_id: { search: () => [], selectedLabel: '99 - Stored' } },
            },
        })

        await flushPromises()

        expect(formOf(wrapper).brand_id).toBe('b9')
        expect(wrapper.find('button[id="brand_id"]').text()).toContain('99 - Stored')
    })

    it('renders remote labels as text and forgets the results once the dropdown closes', async () => {
        const search = vi.fn().mockResolvedValue([{ id: 'p1', name: '<img src=x onerror="window.hacked=1">Lamp' }])
        const wrapper = mount(Form, {
            attachTo: document.body,
            props: { schema: schemaWith(), fieldOverrides: { brand_id: { search } } },
        })

        await type(await open(wrapper), 'lamp')
        await vi.advanceTimersByTimeAsync(300)
        await flushPromises()

        expect(document.body.querySelector('.max-h-64 img')).toBeNull()
        expect(optionButtons()[0].textContent).toContain('<img')

        await wrapper.find('button[id="brand_id"]').trigger('click')
        await flushPromises()
        await open(wrapper)

        expect(optionButtons()).toHaveLength(0)
    })

    it('says the search failed instead of reporting no results', async () => {
        const wrapper = mount(Form, {
            attachTo: document.body,
            props: { schema: schemaWith(), fieldOverrides: { brand_id: { search: vi.fn().mockRejectedValue(new Error('500')) } } },
        })

        await type(await open(wrapper), 'lamp')
        await vi.advanceTimersByTimeAsync(300)
        await flushPromises()

        expect(document.body.querySelector('[data-select-hint]')?.textContent).toContain('Searching failed')
    })

    it('keeps the name of a stored value once a search has found it', async () => {
        const wrapper = mount(Form, {
            attachTo: document.body,
            props: {
                schema: schemaWith({ brand_id: 'b9' }),
                fieldOverrides: { brand_id: { search: vi.fn().mockResolvedValue([{ id: 'b9', name: 'Acme' }]) } },
            },
        })

        await type(await open(wrapper), 'acme')
        await vi.advanceTimersByTimeAsync(300)
        await flushPromises()
        await wrapper.find('button[id="brand_id"]').trigger('click')
        await flushPromises()

        expect(wrapper.find('button[id="brand_id"]').text()).toContain('Acme')
    })
})
