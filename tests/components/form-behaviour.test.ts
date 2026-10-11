import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick } from 'vue'
import Form from '../../resources/js/components/Form.vue'
import type { HttpFormRequest } from '../../resources/js/composables/useHttpForm'

const schemaWith = (fields: Record<string, unknown>[], extra: Record<string, unknown> = {}) => ({
    schemaVersion: '1.5',
    id: 'behaviour',
    action: '/lines',
    method: 'post',
    defaults: {},
    fields,
    ...extra,
})

const formOf = (wrapper: ReturnType<typeof mount>): any => (wrapper.vm as any).form

function httpForm(schema: Record<string, any>, props: Record<string, unknown> = {}) {
    const requests: HttpFormRequest[] = []
    const wrapper = mount(Form, {
        props: {
            schema,
            transport: 'http',
            submitter: async (request: HttpFormRequest) => {
                requests.push(request)
            },
            ...props,
        },
    })

    return { wrapper, requests }
}

afterEach(() => {
    vi.useRealTimers()
})

describe('reset on success', () => {
    const fields = [
        { name: 'description', type: 'text' },
        { name: 'quantity', type: 'number', default: 1 },
    ]

    it('clears the inputs after a successful submit when the schema asks', async () => {
        const { wrapper } = httpForm(schemaWith(fields, { resetOnSuccess: true }))

        formOf(wrapper).description = 'Coffee'
        formOf(wrapper).quantity = 4
        await (wrapper.vm as any).submit()
        await nextTick()

        expect(formOf(wrapper).description).toBe('')
        expect(formOf(wrapper).quantity).toBe(1)
        expect((wrapper.find('input#description').element as HTMLInputElement).value).toBe('')
    })

    it('keeps the inputs by default', async () => {
        const { wrapper } = httpForm(schemaWith(fields))

        formOf(wrapper).description = 'Coffee'
        await (wrapper.vm as any).submit()

        expect(formOf(wrapper).description).toBe('Coffee')
    })

    it('lets the prop win over the schema', async () => {
        const { wrapper } = httpForm(schemaWith(fields, { resetOnSuccess: true }), { resetOnSuccess: false })

        formOf(wrapper).description = 'Coffee'
        await (wrapper.vm as any).submit()

        expect(formOf(wrapper).description).toBe('Coffee')
    })

    it('keeps the inputs after a failed submit', async () => {
        const wrapper = mount(Form, {
            props: {
                schema: schemaWith(fields, { resetOnSuccess: true }),
                transport: 'http',
                submitter: async () => {
                    throw { payload: { errors: { description: ['Too short'] } } }
                },
            },
        })

        formOf(wrapper).description = 'C'
        await (wrapper.vm as any).submit()

        expect(formOf(wrapper).description).toBe('C')
    })

    it('still emits success and calls an onSuccess option', async () => {
        const onSuccess = vi.fn()
        const { wrapper } = httpForm(schemaWith(fields, { resetOnSuccess: true }), { options: { onSuccess } })

        await (wrapper.vm as any).submit()

        expect(onSuccess).toHaveBeenCalled()
    })
})

describe('file fields after a successful submit', () => {
    it('forget the chosen file and empty the input', async () => {
        const { wrapper } = httpForm(schemaWith([
            { name: 'photo', type: 'file', removeFlag: 'remove_photo' },
            { name: 'name', type: 'text' },
        ]))

        const input = wrapper.find('input[type="file"]').element as HTMLInputElement
        Object.defineProperty(input, 'value', { value: 'C:\\fakepath\\a.png', writable: true })

        formOf(wrapper).photo = new File(['x'], 'a.png', { type: 'image/png' })
        formOf(wrapper).remove_photo = true
        formOf(wrapper).name = 'Jane'
        await (wrapper.vm as any).submit()
        await nextTick()

        expect(formOf(wrapper).photo).toBe('')
        expect(formOf(wrapper).remove_photo).toBe(false)
        expect(formOf(wrapper).name).toBe('Jane')
        expect(input.value).toBe('')
    })
})

describe('form-level errors', () => {
    const fields = [
        { name: 'name', type: 'text' },
        { name: 'lines', type: 'repeater', fields: [{ name: 'amount', type: 'text' }] },
    ]

    it('shows errors that belong to no field at the top', async () => {
        const wrapper = mount(Form, { props: { schema: schemaWith(fields) } })

        formOf(wrapper).setError({
            conflicts: 'Two bookings overlap.',
            name: 'The name is required.',
            'lines.0.amount': 'The amount is required.',
        })
        await nextTick()

        const block = wrapper.find('[data-form-errors]')

        expect(block.attributes('role')).toBe('alert')
        expect(block.text()).toBe('Two bookings overlap.')
        expect(wrapper.find('form').element.firstElementChild).toBe(block.element)
    })

    it('shows nothing without such errors', async () => {
        const wrapper = mount(Form, { props: { schema: schemaWith(fields) } })

        formOf(wrapper).setError('name', 'The name is required.')
        await nextTick()

        expect(wrapper.find('[data-form-errors]').exists()).toBe(false)
    })

    it('shows the message of a failed HTTP request', async () => {
        const wrapper = mount(Form, {
            props: {
                schema: schemaWith(fields),
                transport: 'http',
                submitter: async () => {
                    throw new Error('Server down')
                },
            },
        })

        await (wrapper.vm as any).submit()
        await nextTick()

        expect(wrapper.find('[data-form-errors]').text()).toBe('Server down')
    })

    it('lets a slot render them', async () => {
        const wrapper = mount(Form, {
            props: { schema: schemaWith(fields) },
            slots: {
                'form-errors': ({ errors }: { errors: Record<string, string> }) => h('aside', { class: 'custom' }, Object.keys(errors).join(',')),
            },
        })

        formOf(wrapper).setError('form', 'Nope')
        await nextTick()

        expect(wrapper.find('aside.custom').text()).toBe('form')
        expect(wrapper.find('[data-form-errors]').exists()).toBe(false)
    })
})

describe('GET filter forms', () => {
    const schema = schemaWith(
        [
            { name: 'year', type: 'select', options: { 2025: '2025', 2026: '2026' } },
            { name: 'q', type: 'text' },
        ],
        { method: 'get', action: '/bookings', defaults: { year: '2026' } },
    )

    it('visits with the values as query, keeping state and scroll', async () => {
        const wrapper = mount(Form, { props: { schema } })
        const form = formOf(wrapper)
        const get = vi.spyOn(form, 'get').mockImplementation(() => undefined)
        const transform = vi.spyOn(form, 'transform')

        await (wrapper.vm as any).submit()

        expect(get).toHaveBeenCalledWith('/bookings', expect.objectContaining({ preserveState: true, preserveScroll: true }))
        expect(transform.mock.calls[0]![0]({ year: '2026', q: '', tags: [] })).toEqual({ year: '2026' })
    })

    it('stays on the current page without an action', async () => {
        window.history.replaceState({}, '', '/reports?year=2025')

        const wrapper = mount(Form, { props: { schema: { ...schema, action: '' } } })
        const get = vi.spyOn(formOf(wrapper), 'get').mockImplementation(() => undefined)

        await (wrapper.vm as any).submit()

        expect(get).toHaveBeenCalledWith('/reports', expect.any(Object))
    })

    it('submits on change after a short pause', async () => {
        vi.useFakeTimers()

        const wrapper = mount(Form, { props: { schema: { ...schema, submitOnChange: true } } })
        const get = vi.spyOn(formOf(wrapper), 'get').mockImplementation(() => undefined)

        await wrapper.find('input#q').setValue('ha')
        await wrapper.find('input#q').setValue('hall')

        expect(get).not.toHaveBeenCalled()

        vi.advanceTimersByTime(300)

        expect(get).toHaveBeenCalledTimes(1)
    })

    it('does not submit on change unless asked', async () => {
        vi.useFakeTimers()

        const wrapper = mount(Form, { props: { schema } })
        const get = vi.spyOn(formOf(wrapper), 'get').mockImplementation(() => undefined)

        await wrapper.find('input#q').setValue('hall')
        vi.advanceTimersByTime(1000)

        expect(get).not.toHaveBeenCalled()
    })
})
