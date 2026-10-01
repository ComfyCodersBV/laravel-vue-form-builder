import {describe, expect, it} from 'vitest'
import {mount} from '@vue/test-utils'
import SubmitButton from '../../resources/js/components/Fields/SubmitButton.vue'

describe('SubmitButton', () => {
    it('renders an html label and an aria label for an icon-only button', () => {
        const wrapper = mount(SubmitButton, {
            props: {label: 'Save', labelHtml: '<svg data-icon="save"></svg>', ariaLabel: 'Add'},
        })

        const button = wrapper.get('button[type="submit"]')

        expect(button.find('svg[data-icon="save"]').exists()).toBe(true)
        expect(button.text()).toBe('')
        expect(button.attributes('aria-label')).toBe('Add')
    })

    it('renders a plain label as text', () => {
        const wrapper = mount(SubmitButton, {props: {label: 'Save <b>'}})

        const button = wrapper.get('button[type="submit"]')

        expect(button.text()).toBe('Save <b>')
        expect(button.find('b').exists()).toBe(false)
    })
})
