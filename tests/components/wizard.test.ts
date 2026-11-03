import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick } from 'vue'
import Form from '../../resources/js/components/Form.vue'
import type { HttpFormRequest } from '../../resources/js/composables/useHttpForm'

const schemaWith = (extra: Record<string, unknown> = {}) => ({
    schemaVersion: '1.10',
    id: 'wizard',
    action: '/bookings',
    method: 'post',
    defaults: {},
    fields: [
        {
            type: 'step',
            name: 'when',
            title: 'When',
            fields: [
                { name: 'type', type: 'text', default: 'rental' },
                { name: 'day', type: 'text' },
            ],
        },
        {
            type: 'step',
            name: 'who',
            title: 'Who',
            fields: [
                { name: 'renter', type: 'text', condition: "type === 'rental'" },
            ],
        },
        {
            type: 'step',
            name: 'details',
            title: 'Details',
            fields: [
                { name: 'notes', type: 'text' },
            ],
        },
        { type: 'submit', label: 'Save booking' },
    ],
    ...extra,
})

function wizardForm(schema: Record<string, any>, slots: Record<string, any> = {}) {
    const requests: HttpFormRequest[] = []
    const wrapper = mount(Form, {
        attachTo: document.body,
        props: {
            schema,
            transport: 'http',
            submitter: async (request: HttpFormRequest) => {
                requests.push(request)
            },
        },
        slots,
    })

    return { wrapper, requests }
}

const formOf = (wrapper: ReturnType<typeof mount>): any => (wrapper.vm as any).form

const currentStep = (wrapper: ReturnType<typeof mount>) => wrapper.find('[data-step]').attributes('data-step')

async function clickNext(wrapper: ReturnType<typeof mount>): Promise<void> {
    await wrapper.find('[data-step-next]').trigger('click')
    await flushPromises()
}

function precognitionResponse(status: number, body: unknown = null): Response {
    return new Response(body === null ? null : JSON.stringify(body), {
        status,
        headers: { Precognition: 'true', 'Content-Type': 'application/json' },
    })
}

afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
})

describe('form with steps', () => {
    it('shows one step at a time and only submits from the last one', async () => {
        const { wrapper, requests } = wizardForm(schemaWith())

        expect(currentStep(wrapper)).toBe('when')
        expect(wrapper.find('input#day').exists()).toBe(true)
        expect(wrapper.find('input#notes').exists()).toBe(false)
        expect(wrapper.find('[data-step-submit]').exists()).toBe(false)
        expect(wrapper.find('[data-step-progress]').text()).toBe('Step 1 of 3')

        await wrapper.find('form').trigger('submit')
        await flushPromises()

        expect(requests).toHaveLength(0)
        expect(currentStep(wrapper)).toBe('who')

        await clickNext(wrapper)

        expect(currentStep(wrapper)).toBe('details')
        expect(wrapper.find('[data-step-submit]').text()).toBe('Save booking')

        await wrapper.find('form').trigger('submit')
        await flushPromises()

        expect(requests).toHaveLength(1)
    })

    it('skips a step whose fields are all hidden by their condition', async () => {
        const { wrapper } = wizardForm(schemaWith())

        formOf(wrapper).type = 'internal'
        await nextTick()

        expect(wrapper.find('[data-step-progress]').text()).toBe('Step 1 of 2')

        await clickNext(wrapper)

        expect(currentStep(wrapper)).toBe('details')
    })

    it('gives every visible step an equal column in the indicator', async () => {
        const { wrapper } = wizardForm(schemaWith())
        const columns = () => (wrapper.find('nav ol').element as HTMLElement).style.gridTemplateColumns

        expect(columns()).toBe('repeat(3, minmax(0, 1fr))')
        expect(wrapper.findAll('[data-step-title]').map((title) => title.text())).toEqual(['When', 'Who', 'Details'])

        formOf(wrapper).type = 'internal'
        await nextTick()

        expect(columns()).toBe('repeat(2, minmax(0, 1fr))')
    })

    it('goes back to an earlier step without validating', async () => {
        const fetch = vi.fn()
        vi.stubGlobal('fetch', fetch)
        const { wrapper } = wizardForm(schemaWith())

        await clickNext(wrapper)
        await wrapper.find('[data-step-previous]').trigger('click')
        await flushPromises()

        expect(currentStep(wrapper)).toBe('when')
        expect(fetch).not.toHaveBeenCalled()
    })

    it('asks the server to validate the visible fields of the step when the schema asks', async () => {
        const fetch = vi.fn().mockResolvedValue(precognitionResponse(422, { errors: { day: ['Pick a day.'] } }))
        vi.stubGlobal('fetch', fetch)
        const { wrapper } = wizardForm(schemaWith({ validateSteps: true }))

        await clickNext(wrapper)

        const [url, init] = fetch.mock.calls[0]
        expect(url).toBe('/bookings')
        expect(init.headers.Precognition).toBe('true')
        expect(init.headers['Precognition-Validate-Only']).toBe('type,day')
        expect(currentStep(wrapper)).toBe('when')
        expect(formOf(wrapper).errors.day).toBe('Pick a day.')

        fetch.mockResolvedValue(precognitionResponse(204))
        await clickNext(wrapper)

        expect(currentStep(wrapper)).toBe('who')
        expect(formOf(wrapper).errors.day).toBeUndefined()
    })

    it('stays on the step and says so when the server check fails', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 500 })))
        const { wrapper } = wizardForm(schemaWith({ validateSteps: true }))

        await clickNext(wrapper)

        expect(currentStep(wrapper)).toBe('when')
        expect(wrapper.find('[data-step-error]').exists()).toBe(true)
    })

    it('does not count a plain 204 without the precognition header as valid', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))
        const { wrapper } = wizardForm(schemaWith({ validateSteps: true }))

        await clickNext(wrapper)

        expect(currentStep(wrapper)).toBe('when')
    })

    it('jumps back to the first step with an error after a failed submit', async () => {
        const wrapper = mount(Form, {
            attachTo: document.body,
            props: {
                schema: schemaWith(),
                transport: 'http',
                submitter: async () => {
                    throw { errors: { day: ['Pick a day.'] } }
                },
            },
        })

        await clickNext(wrapper)
        await clickNext(wrapper)
        await wrapper.find('form').trigger('submit')
        await flushPromises()

        expect(currentStep(wrapper)).toBe('when')
        expect(formOf(wrapper).errors.day).toBe('Pick a day.')
    })

    it('does not move to another step when errors change without a submit', async () => {
        const { wrapper } = wizardForm(schemaWith())

        await clickNext(wrapper)
        await clickNext(wrapper)
        formOf(wrapper).errors = { day: 'Pick a day.' }
        await flushPromises()

        expect(currentStep(wrapper)).toBe('details')
    })

    it('renders the before and after slots of the current step', async () => {
        const { wrapper } = wizardForm(schemaWith(), {
            'step-when-after': () => h('p', { id: 'after-when' }, 'after'),
            'step-who-before': () => h('p', { id: 'before-who' }, 'before'),
        })

        expect(wrapper.find('#after-when').exists()).toBe(true)
        expect(wrapper.find('#before-who').exists()).toBe(false)

        await clickNext(wrapper)

        expect(wrapper.find('#before-who').exists()).toBe(true)
        expect(wrapper.find('#after-when').exists()).toBe(false)
    })
})
