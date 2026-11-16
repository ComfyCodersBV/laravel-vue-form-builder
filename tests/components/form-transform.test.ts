import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import Form from '../../resources/js/components/Form.vue'

const schemaWith = (fields: Record<string, unknown>[], extra: Record<string, unknown> = {}) => ({
    schemaVersion: '1.16',
    id: 'errors',
    action: '/tags',
    method: 'post',
    defaults: {},
    fields,
    ...extra,
})

const formOf = (wrapper: ReturnType<typeof mount>): any => (wrapper.vm as any).form

describe('the transform prop', () => {
    it('adjusts the payload after the transform of the form itself', async () => {
        const wrapper = mount(Form, {
            props: {
                schema: schemaWith([{ name: 'name', type: 'text' }]),
                transform: (data: Record<string, any>) => ({ ...data, source: 'page' }),
            },
        })
        const form = formOf(wrapper)
        const post = vi.spyOn(form, 'post').mockImplementation(() => undefined)
        const transform = vi.spyOn(form, 'transform')

        await (wrapper.vm as any).submit()

        expect(post).toHaveBeenCalledWith('/tags', expect.any(Object))
        expect(transform.mock.calls[0]![0]({ name: 'Jane' })).toEqual({ name: 'Jane', source: 'page' })
    })

    it('receives the spoofed method of an upload', async () => {
        const seen: Record<string, any>[] = []
        const wrapper = mount(Form, {
            props: {
                schema: schemaWith([{ name: 'avatar', type: 'file' }], { method: 'put' }),
                transform: (data: Record<string, any>) => {
                    seen.push(data)

                    return data
                },
            },
        })
        const form = formOf(wrapper)
        vi.spyOn(form, 'post').mockImplementation(() => undefined)
        const transform = vi.spyOn(form, 'transform')

        form.avatar = new File(['x'], 'a.png', { type: 'image/png' })
        await (wrapper.vm as any).submit()

        expect(transform.mock.calls[0]![0]({ avatar: 'a' })).toEqual({ avatar: 'a', _method: 'put' })
        expect(seen).toEqual([{ avatar: 'a', _method: 'put' }])
    })

    it('drops blank values of a GET form before the page sees them', async () => {
        const wrapper = mount(Form, {
            props: {
                schema: schemaWith([{ name: 'q', type: 'text' }, { name: 'year', type: 'text' }], { method: 'get' }),
                transform: (data: Record<string, any>) => ({ ...data, page: 1 }),
            },
        })
        const form = formOf(wrapper)
        vi.spyOn(form, 'get').mockImplementation(() => undefined)
        const transform = vi.spyOn(form, 'transform')

        await (wrapper.vm as any).submit()

        expect(transform.mock.calls[0]![0]({ q: '', year: '2026' })).toEqual({ year: '2026', page: 1 })
    })
})
