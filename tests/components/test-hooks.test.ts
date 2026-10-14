import {describe, expect, it} from 'vitest'
import {mount} from '@vue/test-utils'
import DateField from '../../resources/js/components/Fields/DateField.vue'
import SubmitButton from '../../resources/js/components/Fields/SubmitButton.vue'
import Tabs from '../../resources/js/components/Tabs.vue'

describe('test hooks', () => {
    it('gives a named button a field test id', () => {
        const wrapper = mount(SubmitButton, {props: {name: 'save', label: 'Save'}})

        expect(wrapper.get('button[type="submit"]').attributes('data-testid')).toBe('field-save')
    })

    it('leaves an unnamed button without a test id', () => {
        const wrapper = mount(SubmitButton, {props: {label: 'Save'}})

        expect(wrapper.get('button[type="submit"]').attributes('data-testid')).toBeUndefined()
    })

    it('gives the date picker trigger the field name as id', () => {
        const wrapper = mount(DateField, {props: {name: 'from_date', label: 'From'}})

        expect(wrapper.find('button#from_date').exists()).toBe(true)
    })

    it('gives every tab and its close button a test id per variant', () => {
        const wrapper = mount(Tabs, {
            props: {
                tabs: [{key: 'brands', label: 'Brands', closable: true}],
                modelValue: 'brands',
                variant: 'sub',
            },
        })

        expect(wrapper.find('[data-testid="sub-tab-brands"]').exists()).toBe(true)
        expect(wrapper.find('[data-testid="sub-tab-brands-close"]').exists()).toBe(true)
    })
})
