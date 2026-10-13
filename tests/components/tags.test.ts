import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import Form from '../../resources/js/components/Form.vue'
import { normalizeTags, splitTags, suggestionsRequestUrl } from '../../resources/js/lib/tags'

const schemaWith = (field: Record<string, unknown>, defaults: Record<string, unknown> = {}) => ({
    schemaVersion: '1.8',
    id: 'tags',
    action: '/',
    method: 'post',
    defaults,
    fields: [{ name: 'to', type: 'tags', label: 'To', ...field }],
})

const formOf = (wrapper: ReturnType<typeof mount>): any => (wrapper.vm as any).form

function paste(input: HTMLInputElement, text: string): void {
    const event = new Event('paste', { bubbles: true, cancelable: true })

    Object.defineProperty(event, 'clipboardData', { value: { getData: () => text } })

    input.dispatchEvent(event)
}

async function type(input: HTMLInputElement, text: string): Promise<void> {
    input.value = text
    input.dispatchEvent(new InputEvent('input', { data: text.slice(-1), bubbles: true }))
    await nextTick()
}

describe('tags helpers', () => {
    it('splits on commas, semicolons and newlines and drops blanks and duplicates', () => {
        expect(splitTags('a@x.nl, b@x.nl;\n c@x.nl\r\n;;')).toEqual(['a@x.nl', 'b@x.nl', 'c@x.nl'])
        expect(normalizeTags([' a ', 'a', '', 'b'])).toEqual(['a', 'b'])
        expect(normalizeTags(null)).toEqual([])
    })

    it('adds the search term to the suggestions url', () => {
        expect(suggestionsRequestUrl('/addresses?folder=1', 'jan', 'https://app.test/mail')).toBe('https://app.test/addresses?folder=1&q=jan')
    })
})

describe('tags field', () => {
    it('reads a comma separated default into a list', () => {
        const form = formOf(mount(Form, { props: { schema: schemaWith({}, { to: 'jane@example.com, john@example.com' }) } }))

        expect(form.to).toEqual(['jane@example.com', 'john@example.com'])
    })

    it('starts empty without a value', () => {
        expect(formOf(mount(Form, { props: { schema: schemaWith({}) } })).to).toEqual([])
    })

    it('splits a pasted list into separate tags', async () => {
        const wrapper = mount(Form, { props: { schema: schemaWith({ emails: true }) } })

        paste(wrapper.find('input[id="to"]').element as HTMLInputElement, 'jane@example.com; john@example.com\nmary@example.com')
        await nextTick()

        expect(formOf(wrapper).to).toEqual(['jane@example.com', 'john@example.com', 'mary@example.com'])
        expect(wrapper.findAll('[data-tag]')).toHaveLength(3)
        expect(wrapper.findAll('input[type="hidden"][name="to[]"]').map((input) => input.attributes('value')))
            .toEqual(['jane@example.com', 'john@example.com', 'mary@example.com'])
    })

    it('adds a tag when a separator is typed', async () => {
        const wrapper = mount(Form, { props: { schema: schemaWith({}) } })

        await type(wrapper.find('input[id="to"]').element as HTMLInputElement, 'urgent,')

        expect(formOf(wrapper).to).toEqual(['urgent'])
    })

    it('does not add more tags than the maximum', async () => {
        const wrapper = mount(Form, { props: { schema: schemaWith({ max: 2 }) } })

        paste(wrapper.find('input[id="to"]').element as HTMLInputElement, 'a, b, c')
        await nextTick()

        expect(formOf(wrapper).to).toEqual(['a', 'b'])
    })

    it('marks an entry that is no e-mail address in email mode', () => {
        const wrapper = mount(Form, { props: { schema: schemaWith({ emails: true }, { to: ['jane@example.com', 'nope'] }) } })

        const tags = wrapper.findAll('[data-tag]')

        expect(tags[0].attributes()).not.toHaveProperty('data-invalid-tag')
        expect(tags[1].attributes()).toHaveProperty('data-invalid-tag')
    })

    it('marks no entry without email mode', () => {
        const wrapper = mount(Form, { props: { schema: schemaWith({}, { to: ['nope'] }) } })

        expect(wrapper.find('[data-tag]').attributes()).not.toHaveProperty('data-invalid-tag')
    })

    it('shows a server error on one entry and marks that entry', async () => {
        const wrapper = mount(Form, { props: { schema: schemaWith({}, { to: ['a', 'b'] }) } })

        formOf(wrapper).setError('to.1', 'The To field must be a valid email address.')
        await nextTick()

        expect(wrapper.text()).toContain('The To field must be a valid email address.')
        expect(wrapper.findAll('[data-tag]')[1].attributes()).toHaveProperty('data-invalid-tag')
    })
})

describe('tags field with suggestions', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        Element.prototype.scrollIntoView = vi.fn()
        vi.stubGlobal('ResizeObserver', class {
            observe() {}
            unobserve() {}
            disconnect() {}
        })
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.unstubAllGlobals()
        document.body.innerHTML = ''
    })

    it('fetches suggestions debounced and adds the one picked', async () => {
        const fetchMock = vi.fn(async () => new Response(JSON.stringify([
            { value: 'jane@example.com', label: 'Jane Doe' },
            { value: 'john@example.com', label: 'John Doe' },
        ]), { status: 200, headers: { 'Content-Type': 'application/json' } }))

        vi.stubGlobal('fetch', fetchMock)

        const wrapper = mount(Form, {
            props: { schema: schemaWith({ emails: true, suggestionsUrl: '/addresses' }) },
            attachTo: document.body,
        })

        const input = wrapper.find('input[id="to"]').element as HTMLInputElement

        await type(input, 'j')
        await type(input, 'ja')

        expect(fetchMock).not.toHaveBeenCalled()

        await vi.advanceTimersByTimeAsync(300)
        await flushPromises()

        expect(fetchMock).toHaveBeenCalledTimes(1)
        expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toContain('/addresses?q=ja')

        const option = [...document.querySelectorAll('[data-tag-suggestions] [role="option"]')]
            .find((element) => element.textContent?.includes('Jane Doe')) as HTMLElement | undefined

        expect(option).toBeDefined()

        option!.click()
        await flushPromises()

        expect(formOf(wrapper).to).toEqual(['jane@example.com'])
        expect(wrapper.find('[data-tag]').text()).toContain('Jane Doe')

        wrapper.unmount()
    })
})
