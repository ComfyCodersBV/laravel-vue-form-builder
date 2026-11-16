import { flushPromises, mount } from '@vue/test-utils'
import { router } from '@inertiajs/vue3'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Form from '../../resources/js/components/Form.vue'

const schemaWith = (id: string, extra: Record<string, unknown> = {}) => ({
    schemaVersion: '1.19',
    id,
    action: `/${id}`,
    method: 'post',
    defaults: {},
    fields: [
        { name: 'email', type: 'email' },
        { name: 'save', type: 'submit', label: 'Save' },
    ],
    ...extra,
})

const pageErrors = {
    newsletter: {
        email: 'The newsletter address is taken.',
        general: 'Try again later.',
    },
}

function answerWithPageErrors() {
    return vi.spyOn(router, 'post').mockImplementation((_url: any, _data: any, options: any = {}) => {
        options.onError?.(options.errorBag ? (pageErrors as Record<string, any>)[options.errorBag] ?? {} : pageErrors)
    })
}

afterEach(() => {
    vi.restoreAllMocks()
})

describe('the error bag of a form', () => {
    it('sends the error bag of the schema with an Inertia submit', async () => {
        const post = vi.spyOn(router, 'post').mockImplementation(() => undefined)
        const wrapper = mount(Form, { props: { schema: schemaWith('newsletter', { errorBag: 'newsletter' }) } })

        await (wrapper.vm as any).submit()

        expect(post.mock.calls[0]![2]).toMatchObject({ errorBag: 'newsletter' })
    })

    it('lets an error bag in the options win over the one of the schema', async () => {
        const post = vi.spyOn(router, 'post').mockImplementation(() => undefined)
        const wrapper = mount(Form, {
            props: {
                schema: schemaWith('newsletter', { errorBag: 'newsletter' }),
                options: { errorBag: 'footer' },
            },
        })

        await (wrapper.vm as any).submit()

        expect(post.mock.calls[0]![2]).toMatchObject({ errorBag: 'footer' })
    })

    it('sends no error bag without one', async () => {
        const post = vi.spyOn(router, 'post').mockImplementation(() => undefined)
        const wrapper = mount(Form, { props: { schema: schemaWith('contact') } })

        await (wrapper.vm as any).submit()

        expect(post.mock.calls[0]![2]).not.toHaveProperty('errorBag')
    })

    it('shows the errors of its own bag on its fields and above the form', async () => {
        answerWithPageErrors()
        const newsletter = mount(Form, { props: { schema: schemaWith('newsletter', { errorBag: 'newsletter' }) } })
        const contact = mount(Form, { props: { schema: schemaWith('contact', { errorBag: 'contact' }) } })

        await (newsletter.vm as any).submit()
        await (contact.vm as any).submit()
        await flushPromises()

        expect(newsletter.text()).toContain('The newsletter address is taken.')
        expect(newsletter.get('[data-form-errors]').text()).toBe('Try again later.')
        expect(contact.text()).not.toContain('The newsletter address is taken.')
        expect(contact.find('[data-form-errors]').exists()).toBe(false)
    })
})
