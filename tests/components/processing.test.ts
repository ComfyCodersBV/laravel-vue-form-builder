import { flushPromises, mount } from '@vue/test-utils'
import { router } from '@inertiajs/vue3'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick, reactive } from 'vue'
import Form from '../../resources/js/components/Form.vue'
import ButtonField from '../../resources/js/components/Fields/Button.vue'

const schemaWith = (fields: Array<Record<string, unknown>>) => ({
    schemaVersion: '1.19',
    id: 'order',
    action: '/orders',
    method: 'post',
    defaults: {},
    fields,
})

const fields = [
    { name: 'title', type: 'text' },
    { name: 'preview', type: 'button', label: 'Preview' },
    { name: 'save', type: 'submit', label: 'Save' },
]

afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
})

describe('buttons while the form is processing', () => {
    it('disables the submit button during an Inertia submit and enables it after', async () => {
        let finish: () => void = () => undefined
        vi.spyOn(router, 'post').mockImplementation((_url: any, _data: any, options: any = {}) => {
            options.onStart?.({})
            finish = () => options.onFinish?.({})
        })
        const wrapper = mount(Form, { props: { schema: schemaWith(fields) } })
        const submit = () => wrapper.get('[data-testid="field-save"]')
        const preview = () => wrapper.get('[data-testid="field-preview"]')

        expect(submit().attributes('disabled')).toBeUndefined()

        await (wrapper.vm as any).submit()
        await nextTick()

        expect(submit().attributes('disabled')).toBeDefined()
        expect(preview().attributes('disabled')).toBeUndefined()

        finish()
        await nextTick()

        expect(submit().attributes('disabled')).toBeUndefined()
    })

    it('disables the submit button while an http submit is pending', async () => {
        let respond: () => void = () => undefined
        const wrapper = mount(Form, {
            props: {
                schema: schemaWith(fields),
                transport: 'http',
                submitter: () => new Promise<void>((resolve) => {
                    respond = resolve
                }),
            },
        })
        const submit = () => wrapper.get('[data-testid="field-save"]')

        void (wrapper.vm as any).submit()
        await nextTick()

        expect(submit().attributes('disabled')).toBeDefined()

        respond()
        await flushPromises()

        expect(submit().attributes('disabled')).toBeUndefined()
    })

    it('disables a delete button while the form is processing', async () => {
        const form = reactive({ processing: false, data: () => ({}) })
        const wrapper = mount(ButtonField, {
            props: { name: 'remove', label: 'Delete', deleteUrl: '/items/1', confirmTitle: 'Sure?', form },
        })
        const button = () => wrapper.get('[data-testid="field-remove"]')

        expect(button().attributes('disabled')).toBeUndefined()

        form.processing = true
        await nextTick()

        expect(button().attributes('disabled')).toBeDefined()
    })

    it('disables the confirm button of a delete while the delete is on its way', async () => {
        let finish: () => void = () => undefined
        const remove = vi.spyOn(router, 'delete').mockImplementation((_url: any, options: any = {}) => {
            options.onStart?.({})
            finish = () => options.onFinish?.({})
        })
        mount(ButtonField, {
            attachTo: document.body,
            props: { name: 'remove', label: 'Delete', deleteUrl: '/items/1', confirmTitle: 'Sure?', cancelLabel: 'Cancel' },
        })
        const confirm = () => document.querySelector<HTMLButtonElement>('[data-testid="field-remove-confirm"]')!

        document.querySelector<HTMLButtonElement>('[data-testid="field-remove"]')!.click()
        await flushPromises()

        confirm().click()
        await nextTick()

        expect(remove).toHaveBeenCalledTimes(1)
        expect(confirm().disabled).toBe(true)

        finish()
        await nextTick()

        expect(confirm().disabled).toBe(false)
    })
})

describe('$processing in expressions', () => {
    it('lets labels, disabled states and conditions follow the submit', async () => {
        let finish: () => void = () => undefined
        vi.spyOn(router, 'post').mockImplementation((_url: any, _data: any, options: any = {}) => {
            options.onStart?.({})
            finish = () => options.onFinish?.({})
        })
        const wrapper = mount(Form, {
            props: {
                schema: schemaWith([
                    { name: 'title', type: 'text', default: 'Order' },
                    { name: 'busy', type: 'display', expression: '"Saving"', condition: '$processing' },
                    { name: 'preview', type: 'button', label: 'Preview', disabledIf: '$processing || !title' },
                    { name: 'save', type: 'submit', label: 'Save', labelExpression: '$processing ? "Saving…" : "Save"' },
                ]),
            },
        })
        const preview = () => wrapper.get('[data-testid="field-preview"]')
        const save = () => wrapper.get('[data-testid="field-save"]')

        expect(save().text()).toBe('Save')
        expect(preview().attributes('disabled')).toBeUndefined()
        expect(wrapper.text()).not.toContain('Saving')

        await (wrapper.vm as any).submit()
        await nextTick()

        expect(save().text()).toBe('Saving…')
        expect(preview().attributes('disabled')).toBeDefined()
        expect(wrapper.text()).toContain('Saving')

        finish()
        await nextTick()

        expect(save().text()).toBe('Save')
        expect(preview().attributes('disabled')).toBeUndefined()
    })

    it('keeps $processing out of the submitted values', async () => {
        const post = vi.spyOn(router, 'post').mockImplementation(() => undefined)
        const wrapper = mount(Form, { props: { schema: schemaWith(fields) } })

        await (wrapper.vm as any).submit()

        expect(post.mock.calls[0]![1]).not.toHaveProperty('$processing')
    })
})
