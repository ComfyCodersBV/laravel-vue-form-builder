import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import Form from '../../resources/js/components/Form.vue'
import type { HttpFormRequest } from '../../resources/js/composables/useHttpForm'

const schemaWith = (fields: Array<Record<string, unknown>>, extra: Record<string, unknown> = {}) => ({
    schemaVersion: '1.18',
    id: 'correct',
    action: '/correct',
    method: 'post',
    defaults: {},
    fields,
    ...extra,
})

const action = { name: 'action', type: 'radio', options: { rebook: 'Rebook', return: 'Return' }, default: 'rebook' }

const rebookOnly = { field: 'action', values: ['rebook'] }

const formOf = (wrapper: ReturnType<typeof mount>): any => (wrapper.vm as any).form

function httpForm(fields: Array<Record<string, unknown>>, props: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) {
    const requests: HttpFormRequest[] = []
    const wrapper = mount(Form, {
        attachTo: document.body,
        props: {
            schema: schemaWith(fields, extra),
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
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    document.body.innerHTML = ''
})

describe('a condition on a field and its values', () => {
    it('shows the field only while the other field holds one of the values', async () => {
        const { wrapper } = httpForm([action, { name: 'destination', type: 'text', when: rebookOnly }])

        expect(wrapper.find('input[name="destination"]').exists()).toBe(true)

        formOf(wrapper).action = 'return'
        await nextTick()

        expect(wrapper.find('input[name="destination"]').exists()).toBe(false)
    })

    it('compares the value a checkbox sends, as the server does', async () => {
        const { wrapper } = httpForm([
            { name: 'extra', type: 'checkbox', value: '1', falseValue: '0' },
            { name: 'extra_number', type: 'text', when: { field: 'extra', values: ['true', '1'] } },
        ])

        expect(wrapper.find('input[name="extra_number"]').exists()).toBe(false)

        formOf(wrapper).extra = true
        await nextTick()
        expect(wrapper.find('input[name="extra_number"]').exists()).toBe(true)

        formOf(wrapper).extra = '0'
        await nextTick()
        expect(wrapper.find('input[name="extra_number"]').exists()).toBe(false)

        formOf(wrapper).extra = '1'
        await nextTick()
        expect(wrapper.find('input[name="extra_number"]').exists()).toBe(true)
    })

    it('prefers the field and values over the expression sent for older renderers', () => {
        const { wrapper } = httpForm([action, { name: 'destination', type: 'text', when: rebookOnly, condition: 'false' }])

        expect(wrapper.find('input[name="destination"]').exists()).toBe(true)
    })
})

describe('the payload of a form with conditions', () => {
    it('leaves out a field hidden by a condition on a field and its values', async () => {
        const { wrapper, requests } = httpForm([action, { name: 'destination', type: 'text', when: rebookOnly }])
        const form = formOf(wrapper)

        form.destination = 'Lyon'
        form.action = 'return'
        await (wrapper.vm as any).submit()

        expect(requests[0]!.data).toEqual({ action: 'return' })
    })

    it('keeps sending a field hidden by an expression', async () => {
        const { wrapper, requests } = httpForm([action, { name: 'destination', type: 'text', condition: "action === 'rebook'" }])
        const form = formOf(wrapper)

        form.destination = 'Lyon'
        form.action = 'return'
        await (wrapper.vm as any).submit()

        expect(requests[0]!.data).toEqual({ action: 'return', destination: 'Lyon' })
    })

    it('leaves out every field of a hidden section and keeps a visible one', async () => {
        const { wrapper, requests } = httpForm([
            action,
            {
                type: 'section',
                when: rebookOnly,
                fields: [
                    { name: 'destination', type: 'text' },
                    { type: 'section', fields: [{ name: 'carrier', type: 'text' }] },
                ],
            },
        ])
        const form = formOf(wrapper)

        await (wrapper.vm as any).submit()
        form.action = 'return'
        await (wrapper.vm as any).submit()

        expect(requests[0]!.data).toEqual({ action: 'rebook', destination: '', carrier: '' })
        expect(requests[1]!.data).toEqual({ action: 'return' })
    })

    it('leaves a hidden sub-field out of its own row only', async () => {
        const { wrapper, requests } = httpForm([{
            name: 'barrels',
            type: 'repeater',
            fields: [
                { name: 'kind', type: 'text' },
                { name: 'weight', type: 'text', when: { field: 'kind', values: ['full'] } },
            ],
        }])
        const form = formOf(wrapper)

        form.barrels = [{ kind: 'empty', weight: '3' }, { kind: 'full', weight: '12' }]
        await nextTick()
        await (wrapper.vm as any).submit()

        expect(requests[0]!.data).toEqual({ barrels: [{ kind: 'empty' }, { kind: 'full', weight: '12' }] })
        expect(wrapper.findAll('input[name="weight"]')).toHaveLength(1)
    })

    it('leaves hidden fields out of an Inertia submit before the transform prop sees the data', async () => {
        const seen: Record<string, any>[] = []
        const wrapper = mount(Form, {
            props: {
                schema: schemaWith([action, { name: 'destination', type: 'text', when: rebookOnly }]),
                transform: (data: Record<string, any>) => {
                    seen.push(data)

                    return data
                },
            },
        })
        const form = formOf(wrapper)
        vi.spyOn(form, 'post').mockImplementation(() => undefined)
        const transform = vi.spyOn(form, 'transform')

        await (wrapper.vm as any).submit()

        expect(transform.mock.calls[0]![0]({ action: 'return', destination: 'Lyon' })).toEqual({ action: 'return' })
        expect(seen).toEqual([{ action: 'return' }])
    })

    it('checks only the visible fields of a wizard step', async () => {
        const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204, headers: { Precognition: 'true' } }))
        vi.stubGlobal('fetch', fetch)
        const { wrapper } = httpForm([
            {
                type: 'step',
                name: 'what',
                title: 'What',
                fields: [
                    { ...action, default: 'return' },
                    { name: 'destination', type: 'text', when: rebookOnly },
                ],
            },
            { type: 'step', name: 'notes', title: 'Notes', fields: [{ name: 'notes', type: 'text' }] },
        ], {}, { validateSteps: true })

        await wrapper.find('[data-step-next]').trigger('click')
        await flushPromises()

        expect(fetch.mock.calls[0]![1].headers['Precognition-Validate-Only']).toBe('action')
    })
})

describe('a submit button with expressions', () => {
    const ids = { name: 'ids', type: 'checkboxes', options: { 1: 'One', 2: 'Two' }, default: [] }

    const submit = (extra: Record<string, unknown> = {}) => ({
        type: 'submit',
        label: 'Save',
        labelExpression: "`${action === 'return' ? 'Return' : 'Rebook'} (${ids.length})`",
        disabledIf: 'ids.length === 0',
        ...extra,
    })

    it('follows the form in its label and disabled state', async () => {
        const { wrapper } = httpForm([action, ids, submit()])
        const button = () => wrapper.get('button[type="submit"]')

        expect(button().text()).toBe('Rebook (0)')
        expect(button().attributes('disabled')).toBeDefined()

        formOf(wrapper).ids = [1, 2]
        formOf(wrapper).action = 'return'
        await nextTick()

        expect(button().text()).toBe('Return (2)')
        expect(button().attributes('disabled')).toBeUndefined()
    })

    it('falls back to its label and stays disabled when the expressions fail', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        const { wrapper } = httpForm([action, submit({ labelExpression: 'missing.length', disabledIf: 'missing.length' })])
        const button = wrapper.get('button[type="submit"]')

        expect(button.text()).toBe('Save')
        expect(button.attributes('disabled')).toBeDefined()
    })

    it('applies to the submit button of the last wizard step', async () => {
        const { wrapper } = httpForm([
            { type: 'step', name: 'pick', title: 'Pick', fields: [action, ids] },
            submit(),
        ])
        const button = () => wrapper.get('[data-step-submit]')

        expect(button().text()).toBe('Rebook (0)')
        expect(button().attributes('disabled')).toBeDefined()

        formOf(wrapper).ids = [2]
        await nextTick()

        expect(button().text()).toBe('Rebook (1)')
        expect(button().attributes('disabled')).toBeUndefined()
    })
})

describe('a button that emits an event', () => {
    it('re-emits the click from the form with the field and the form', async () => {
        const onClick = vi.fn()
        const { wrapper } = httpForm(
            [{ name: 'make_rows', type: 'button', label: 'Make rows', emit: 'make-rows' }],
            { fieldOverrides: { make_rows: { onClick } } },
        )

        await wrapper.get('[data-testid="field-make_rows"]').trigger('click')

        const [event, payload] = wrapper.emitted('button')![0] as [string, any]
        expect(event).toBe('make-rows')
        expect(payload.field).toBe('make_rows')
        expect(payload.form).toBe(formOf(wrapper))
        expect(payload.row).toBeUndefined()
        expect(onClick).toHaveBeenCalledOnce()
    })

    it('passes the row of a repeater it sits in', async () => {
        const { wrapper } = httpForm([{
            name: 'barrels',
            type: 'repeater',
            default: [{ number: '7' }],
            fields: [
                { name: 'number', type: 'text' },
                { name: 'copy', type: 'button', label: 'Copy', emit: 'copy-row' },
            ],
        }])
        formOf(wrapper).barrels = [{ number: '7' }]
        await nextTick()

        await wrapper.get('[data-testid="field-copy"]').trigger('click')

        const [event, payload] = wrapper.emitted('button')![0] as [string, any]
        expect(event).toBe('copy-row')
        expect(payload.row.number).toBe('7')
    })

    it('emits after the confirmation of a button that asks for one', async () => {
        const { wrapper } = httpForm([{
            name: 'clear',
            type: 'button',
            label: 'Clear',
            emit: 'clear-rows',
            confirmTitle: 'Sure?',
            cancelLabel: 'Cancel',
        }])

        await wrapper.get('[data-testid="field-clear"]').trigger('click')
        await flushPromises()

        expect(wrapper.emitted('button')).toBeUndefined()

        document.querySelector<HTMLButtonElement>('[data-testid="field-clear-confirm"]')!.click()
        await flushPromises()

        expect(wrapper.emitted('button')![0]![0]).toBe('clear-rows')
    })
})

describe('a condition on an empty value', () => {
    it('treats an empty field as null, as the server does after ConvertEmptyStringsToNull', async () => {
        const { wrapper, requests } = httpForm([
            { name: 'reference', type: 'text' },
            { name: 'reason', type: 'text', when: { field: 'reference', values: ['null'] } },
        ])

        expect(wrapper.find('input[name="reason"]').exists()).toBe(true)

        formOf(wrapper).reference = 'R-1'
        formOf(wrapper).reason = 'stale'
        await (wrapper.vm as any).submit()

        expect(requests[0]!.data).toEqual({ reference: 'R-1' })
    })
})

describe('a condition on a field that is hidden itself', () => {
    const chain = [
        action,
        { type: 'section', when: rebookOnly, fields: [{ name: 'express', type: 'checkbox', value: '1', falseValue: '0' }] },
        {
            name: 'courier',
            type: 'text',
            when: { field: 'express', values: ['true', '1'], also: [{ field: 'action', values: ['rebook'] }] },
        },
    ]

    it('hides the field and leaves it out of the payload', async () => {
        const { wrapper, requests } = httpForm(chain)
        const form = formOf(wrapper)

        form.express = '1'
        await nextTick()
        expect(wrapper.find('input[name="courier"]').exists()).toBe(true)

        form.courier = 'DHL'
        form.action = 'return'
        await nextTick()
        expect(wrapper.find('input[name="courier"]').exists()).toBe(false)

        await (wrapper.vm as any).submit()

        expect(requests[0]!.data).toEqual({ action: 'return' })
    })
})

describe('a delete button with expressions', () => {
    it('follows the form in its label and disabled state', async () => {
        const { wrapper } = httpForm([
            { name: 'ids', type: 'checkboxes', options: { 1: 'One', 2: 'Two' }, default: [] },
            {
                name: 'remove',
                type: 'delete',
                label: 'Delete',
                deleteUrl: '/items',
                confirmTitle: 'Sure?',
                cancelLabel: 'Cancel',
                labelExpression: '`Delete ${ids.length}`',
                disabledIf: 'ids.length === 0',
            },
        ])
        const button = () => wrapper.get('[data-testid="field-remove"]')

        expect(button().text()).toBe('Delete 0')
        expect(button().attributes('disabled')).toBeDefined()

        formOf(wrapper).ids = [1]
        await nextTick()

        expect(button().text()).toBe('Delete 1')
        expect(button().attributes('disabled')).toBeUndefined()
    })

    it('stays disabled and keeps its label when the expressions fail', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        const { wrapper } = httpForm([{
            name: 'remove',
            type: 'delete',
            label: 'Delete',
            deleteUrl: '/items',
            labelExpression: 'missing.length',
            disabledIf: 'missing.length',
        }])
        const button = wrapper.get('[data-testid="field-remove"]')

        expect(button.text()).toBe('Delete')
        expect(button.attributes('disabled')).toBeDefined()
    })
})
