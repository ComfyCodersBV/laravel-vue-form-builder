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
})
