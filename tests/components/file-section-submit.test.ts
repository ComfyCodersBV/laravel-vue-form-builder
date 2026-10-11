import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import Form from '../../resources/js/components/Form.vue'
import type { HttpFormRequest } from '../../resources/js/composables/useHttpForm'

const schemaWith = (fields: Record<string, unknown>[], extra: Record<string, unknown> = {}) => ({
    schemaVersion: '1.4',
    id: 'test-form',
    action: '/bookings',
    method: 'post',
    defaults: {},
    fields,
    ...extra,
})

function formOf(wrapper: ReturnType<typeof mount>): any {
    return (wrapper.vm as any).form
}

describe('file field with a current file', () => {
    const avatar = {
        name: 'avatar',
        type: 'file',
        currentUrl: 'https://cdn.test/avatars/jane.jpg?v=2',
        currentName: 'jane.jpg',
        removeFlag: 'remove_avatar',
    }

    it('shows the current file with an image preview', () => {
        const wrapper = mount(Form, { props: { schema: schemaWith([avatar]) } })

        expect(wrapper.find('[data-current-file] img').attributes('src')).toBe(avatar.currentUrl)
        expect(wrapper.find('[data-current-file] a[href]').exists()).toBe(true)
        expect(wrapper.text()).toContain('jane.jpg')
    })

    it('shows a link without a preview for a file that is no image', () => {
        const wrapper = mount(Form, {
            props: { schema: schemaWith([{ ...avatar, currentUrl: '/files/contract.pdf', currentName: 'Contract' }]) },
        })

        expect(wrapper.find('[data-current-file] img').exists()).toBe(false)
        expect(wrapper.text()).toContain('Contract')
    })

    it('does not preview when the preview is turned off', () => {
        const wrapper = mount(Form, { props: { schema: schemaWith([{ ...avatar, preview: false }]) } })

        expect(wrapper.find('[data-current-file] img').exists()).toBe(false)
    })

    it('submits the remove flag', async () => {
        const wrapper = mount(Form, { props: { schema: schemaWith([avatar]) } })

        expect(formOf(wrapper).remove_avatar).toBe(false)

        await wrapper.find('[data-current-file] input[type="checkbox"]').setValue(true)

        expect(formOf(wrapper).remove_avatar).toBe(true)
        expect(wrapper.find('input[type="hidden"][name="remove_avatar"]').attributes('value')).toBe('1')
    })

    it('offers no remove control without a remove flag', () => {
        const wrapper = mount(Form, { props: { schema: schemaWith([{ ...avatar, removeFlag: undefined }]) } })

        expect(wrapper.find('[data-current-file] input[type="checkbox"]').exists()).toBe(false)
        expect(formOf(wrapper)).not.toHaveProperty('remove_avatar')
    })
})

describe('sections', () => {
    const schema = schemaWith([
        {
            type: 'section',
            title: 'Contact',
            description: 'How we <strong>reach</strong> you',
            fields: [
                { name: 'newsletter', type: 'checkbox', value: '1', falseValue: '0' },
                { name: 'email', type: 'text', default: 'jane@example.com' },
            ],
        },
        { name: 'topics', type: 'text', condition: 'form.newsletter' },
    ])

    it('renders a heading, a description and its fields', () => {
        const wrapper = mount(Form, { props: { schema } })

        expect(wrapper.find('[data-form-section] h3').text()).toBe('Contact')
        expect(wrapper.find('[data-form-section] strong').text()).toBe('reach')
        expect(wrapper.find('[data-form-section] input[name="email"]').exists()).toBe(true)
    })

    it('holds the values of the fields inside it', () => {
        const form = formOf(mount(Form, { props: { schema } }))

        expect(form.email).toBe('jane@example.com')
        expect(form.newsletter).toBe('0')
    })

    it('lets a condition outside the section read a checkbox inside it', async () => {
        const wrapper = mount(Form, { props: { schema } })

        expect(wrapper.find('input[name="topics"]').exists()).toBe(false)

        formOf(wrapper).newsletter = '1'
        await nextTick()

        expect(wrapper.find('input[name="topics"]').exists()).toBe(true)
    })
})

describe('reusing one schema', () => {
    const fields = [
        { name: 'reason', type: 'text' },
        { name: 'booking_id', type: 'hidden' },
    ]

    function mountWith(props: Record<string, unknown>) {
        const requests: HttpFormRequest[] = []

        const wrapper = mount(Form, {
            props: {
                schema: schemaWith(fields, { defaults: { reason: 'Full' } }),
                transport: 'http',
                submitter: async (request: HttpFormRequest) => {
                    requests.push(request)
                },
                ...props,
            },
        })

        return { wrapper, requests }
    }

    it('overrides action, method and defaults per use', async () => {
        const { wrapper, requests } = mountWith({
            action: '/bookings/7/reject',
            method: 'patch',
            defaults: { booking_id: 7 },
        })

        await (wrapper.vm as any).submit()

        expect(requests[0]).toEqual({
            method: 'patch',
            url: '/bookings/7/reject',
            data: { reason: 'Full', booking_id: 7 },
        })
    })

    it('loads new defaults when they change', async () => {
        const { wrapper, requests } = mountWith({ defaults: { booking_id: 7 } })

        formOf(wrapper).reason = 'Typed'
        await wrapper.setProps({ defaults: { booking_id: 8 } })
        await (wrapper.vm as any).submit()

        expect(requests[0].data).toEqual({ reason: 'Full', booking_id: 8 })
    })

    it('keeps typed values when the defaults stay the same', async () => {
        const { wrapper, requests } = mountWith({ defaults: { booking_id: 7 } })

        formOf(wrapper).reason = 'Typed'
        await wrapper.setProps({ defaults: { booking_id: 7 } })
        await (wrapper.vm as any).submit()

        expect(requests[0].data.reason).toBe('Typed')
    })
})

describe('method spoofing for uploads', () => {
    const schema = schemaWith([{ name: 'avatar', type: 'file' }, { name: 'name', type: 'text' }], { method: 'put', action: '/profile' })

    it('posts with _method when a PUT carries a file', async () => {
        const wrapper = mount(Form, { props: { schema } })
        const form = formOf(wrapper)
        const post = vi.spyOn(form, 'post').mockImplementation(() => undefined)
        const put = vi.spyOn(form, 'put').mockImplementation(() => undefined)
        const transform = vi.spyOn(form, 'transform')

        form.avatar = new File(['x'], 'a.png', { type: 'image/png' })
        await (wrapper.vm as any).submit()

        expect(put).not.toHaveBeenCalled()
        expect(post).toHaveBeenCalledWith('/profile', expect.any(Object))
        expect(transform.mock.calls[0][0]({ name: 'Jane' })).toEqual({ name: 'Jane', _method: 'put' })
    })

    it('keeps PUT without a file and drops the spoofing again', async () => {
        const wrapper = mount(Form, { props: { schema } })
        const form = formOf(wrapper)
        vi.spyOn(form, 'post').mockImplementation(() => undefined)
        const put = vi.spyOn(form, 'put').mockImplementation(() => undefined)
        const transform = vi.spyOn(form, 'transform')

        form.avatar = new File(['x'], 'a.png', { type: 'image/png' })
        await (wrapper.vm as any).submit()

        form.avatar = ''
        await (wrapper.vm as any).submit()

        expect(put).toHaveBeenCalledWith('/profile', expect.any(Object))
        expect(transform.mock.calls[1][0]({ name: 'Jane' })).toEqual({ name: 'Jane' })
    })
})
