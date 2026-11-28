import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Form from '../../resources/js/components/Form.vue'

const mountNumber = (extra: Record<string, unknown> = {}) => mount(Form, {
    props: {
        schema: {
            schemaVersion: '1.16',
            id: 'f',
            action: '/',
            method: 'post',
            defaults: {},
            fields: [{ name: 'amount', type: 'number', label: 'Amount', ...extra }],
        },
    },
})

describe('number field autocomplete', () => {
    it('puts the autocomplete value on the input', () => {
        const wrapper = mountNumber({ autocomplete: 'off' })

        expect(wrapper.find('input[name="amount"]').attributes('autocomplete')).toBe('off')
    })

    it('leaves the attribute off when none is set', () => {
        const wrapper = mountNumber()

        expect(wrapper.find('input[name="amount"]').attributes('autocomplete')).toBeUndefined()
    })
})
