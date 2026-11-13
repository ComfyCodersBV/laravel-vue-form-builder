import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import Form from '../../resources/js/components/Form.vue'
import { rememberKey } from '../../resources/js/lib/remember'

const schema = (extra: Record<string, unknown> = {}) => ({
    schemaVersion: '1.15',
    id: 'wizard',
    action: '/bookings',
    method: 'post',
    defaults: {},
    stepParam: 'step',
    fields: [
        { type: 'step', name: 'when', title: 'When', fields: [{ name: 'day', type: 'text', rules: ['required'] }] },
        { type: 'step', name: 'who', title: 'Who', fields: [{ name: 'renter', type: 'text' }] },
        { type: 'step', name: 'details', title: 'Details', fields: [{ name: 'notes', type: 'text' }] },
        { type: 'submit', label: 'Save' },
    ],
    ...extra,
})

function visit(search: string): void {
    window.history.replaceState(null, '', `/bookings/create${search}`)
}

function wizardForm(props: Record<string, unknown> = {}) {
    return mount(Form, {
        attachTo: document.body,
        props: { schema: schema(), transport: 'http', submitter: async () => {}, ...props },
    })
}

const currentStep = (wrapper: ReturnType<typeof mount>) => wrapper.find('[data-step]').attributes('data-step')

afterEach(() => {
    vi.restoreAllMocks()
    window.sessionStorage.clear()
    document.body.innerHTML = ''
    visit('')
})

describe('wizard step in the query string', () => {
    it('writes the current step to the url with a replace', async () => {
        visit('?renter=5')
        const pushState = vi.spyOn(window.history, 'pushState')
        const wrapper = wizardForm({ defaults: { day: 'friday' } })
        await flushPromises()

        expect(window.location.search).toBe('?renter=5&step=when')

        await wrapper.find('[data-step-next]').trigger('click')
        await flushPromises()

        expect(window.location.search).toBe('?renter=5&step=who')
        expect(pushState).not.toHaveBeenCalled()
    })

    it('opens the step from the url when the steps before it are filled', async () => {
        visit('?step=details')
        const wrapper = wizardForm({ defaults: { day: 'friday' } })
        await nextTick()

        expect(currentStep(wrapper)).toBe('details')
    })

    it('ignores a step that cannot be reached yet or does not exist', async () => {
        visit('?step=details')
        expect(currentStep(wizardForm())).toBe('when')

        document.body.innerHTML = ''
        visit('?step=nope')
        expect(currentStep(wizardForm({ defaults: { day: 'friday' } }))).toBe('when')
    })

    it('leaves the url alone without stepParam or when the prop turns it off', async () => {
        visit('')
        wizardForm({ schema: schema({ stepParam: undefined }) })
        await flushPromises()
        expect(window.location.search).toBe('')

        wizardForm({ stepParam: false })
        await flushPromises()
        expect(window.location.search).toBe('')
    })

    it('keeps the remember key the same whatever step the url holds', () => {
        visit('?renter=5&step=who')
        const withStep = rememberKey('booking', 'wizard', 'step')
        visit('?renter=5')

        expect(withStep).toBe(rememberKey('booking', 'wizard', 'step'))
    })

    it('restores remembered values after a reload on a later step', async () => {
        vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
            { type: 'navigate', name: window.location.href } as unknown as PerformanceEntry,
        ])
        visit('')
        const first = wizardForm({ remember: 'booking' })
        ;(first.vm as any).form.day = 'friday'
        await first.find('[data-step-next]').trigger('click')
        await flushPromises()
        first.unmount()

        expect(window.location.search).toBe('?step=who')

        vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
            { type: 'reload', name: window.location.href } as unknown as PerformanceEntry,
        ])
        const wrapper = wizardForm({ remember: 'booking' })
        await nextTick()

        expect(currentStep(wrapper)).toBe('who')
        expect((wrapper.vm as any).form.day).toBe('friday')
    })
})
