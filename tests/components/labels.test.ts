import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Form from '../../resources/js/components/Form.vue'

const schemaWith = (fields: Record<string, unknown>[]) => ({
    schemaVersion: '1.5',
    id: 'labels',
    action: '/',
    method: 'post',
    defaults: {},
    fields,
})

const labelsOf = (wrapper: ReturnType<typeof mount>, text: string) =>
    wrapper.findAll('label').filter((label) => label.text() === text)

describe('labels of a single checkbox and toggle', () => {
    it('shows the label of a checkbox once, next to the box', () => {
        const wrapper = mount(Form, { props: { schema: schemaWith([{ name: 'active', type: 'checkbox', label: 'Active' }]) } })

        expect(labelsOf(wrapper, 'Active')).toHaveLength(1)
        expect(labelsOf(wrapper, 'Active')[0]!.attributes('for')).toBe('active-cb')
    })

    it('keeps the label above when the checkbox has a label of its own', () => {
        const wrapper = mount(Form, {
            props: { schema: schemaWith([{ name: 'terms', type: 'checkbox', label: 'Terms', checkboxLabel: 'I agree' }]) },
        })

        expect(labelsOf(wrapper, 'Terms')).toHaveLength(1)
        expect(labelsOf(wrapper, 'I agree')).toHaveLength(1)
    })

    it('shows the label of a toggle once', () => {
        const wrapper = mount(Form, { props: { schema: schemaWith([{ name: 'on', type: 'toggle', label: 'On duty' }]) } })

        expect(labelsOf(wrapper, 'On duty')).toHaveLength(1)
        expect(labelsOf(wrapper, 'On duty')[0]!.attributes('for')).toBe('on-tgl')
    })
})

describe('hidden labels', () => {
    it('keeps a hidden label for screen readers only', () => {
        const wrapper = mount(Form, { props: { schema: schemaWith([{ name: 'q', type: 'text', label: 'Search', hideLabel: true }]) } })

        const label = labelsOf(wrapper, 'Search')[0]!

        expect(label.classes()).toEqual(['sr-only'])
        expect(label.attributes('for')).toBe('q')
    })

    it('hides the inline label of a checkbox', () => {
        const wrapper = mount(Form, {
            props: { schema: schemaWith([{ name: 'active', type: 'checkbox', label: 'Active', hideLabel: true }]) },
        })

        expect(labelsOf(wrapper, 'Active')[0]!.classes()).toContain('sr-only')
    })

    it('hides only the label of the field that asks for it', () => {
        const wrapper = mount(Form, {
            props: {
                schema: schemaWith([
                    { name: 'q', type: 'text', label: 'Search', hideLabel: true },
                    { name: 'year', type: 'number', label: 'Year' },
                ]),
            },
        })

        expect(labelsOf(wrapper, 'Year')[0]!.classes()).not.toContain('sr-only')
    })

    it('drops the label column of a horizontal layout', () => {
        const wrapper = mount(Form, {
            props: { schema: schemaWith([{ name: 'q', type: 'text', label: 'Search', hideLabel: true }]), layout: 'horizontal' },
        })

        expect(labelsOf(wrapper, 'Search')[0]!.classes()).toEqual(['sr-only'])
        expect(wrapper.html()).not.toContain('sm:w-40')
    })
})

describe('checkbox in a horizontal layout', () => {
    it('lines up with the controls', () => {
        const wrapper = mount(Form, {
            props: { schema: schemaWith([{ name: 'active', type: 'checkbox', label: 'Active' }]), layout: 'horizontal' },
        })

        expect(wrapper.html()).toContain('sm:pl-[10.75rem]')
    })
})
