import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import Form from '../../resources/js/components/Form.vue'

const schemaWith = (fields: Array<Record<string, unknown>>, defaults: Record<string, unknown> = {}) => ({
    schemaVersion: '1.13',
    id: 'entries',
    action: '/',
    method: 'post',
    defaults,
    fields,
})

const formOf = (wrapper: ReturnType<typeof mount>): any => (wrapper.vm as any).form

describe('errors of entries', () => {
    it('shows the errors of single files under a files field', async () => {
        const wrapper = mount(Form, { props: { schema: schemaWith([{ name: 'files', type: 'file', multiple: true }]) } })

        formOf(wrapper).setError({
            'files.0': 'report.exe is not allowed.',
            'files.2': 'huge.pdf is too large.',
        })
        await nextTick()

        expect(wrapper.text()).toContain('report.exe is not allowed. huge.pdf is too large.')
        expect(wrapper.find('[data-form-errors]').exists()).toBe(false)
    })

    it('prefers the error of the files field itself', async () => {
        const wrapper = mount(Form, { props: { schema: schemaWith([{ name: 'files', type: 'file', multiple: true }]) } })

        formOf(wrapper).setError({
            files: 'Upload at most 10 files.',
            'files.0': 'report.exe is not allowed.',
        })
        await nextTick()

        expect(wrapper.text()).toContain('Upload at most 10 files.')
        expect(wrapper.text()).not.toContain('report.exe')
    })
})
