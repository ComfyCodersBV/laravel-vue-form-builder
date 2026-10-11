import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import Form from '../../resources/js/components/Form.vue'
import { formatMinorUnits, moneyFormat, parseMinorUnits } from '../../resources/js/lib/money'

describe('parsing money', () => {
    it.each([
        ['12,50', 'nl', 1250],
        ['1.234,56', 'nl', 123456],
        ['12.5', 'nl', 1250],
        ['1.250', 'nl', 125000],
        ['€ 7', 'nl', 700],
        ['1,234.56', 'en', 123456],
        ['12,5', 'en', 1250],
        ['-3.10', 'en', -310],
        ['12.345', 'en', 1235],
    ])('reads %s in %s as %d minor units', (text, locale, expected) => {
        expect(parseMinorUnits(text, 2, locale, 'EUR')).toEqual({ valid: true, value: expected })
    })

    it('reads an empty text as no amount', () => {
        expect(parseMinorUnits('  ', 2, 'nl', 'EUR')).toEqual({ valid: true, value: null })
    })

    it('marks text that is no amount as invalid', () => {
        expect(parseMinorUnits('twelve', 2, 'en', 'EUR').valid).toBe(false)
    })

    it('respects the decimals of the currency', () => {
        expect(parseMinorUnits('1.500', 0, 'nl', 'JPY')).toEqual({ valid: true, value: 1500 })
        expect(formatMinorUnits(1500, 0, 'en')).toBe('1,500')
    })
})

describe('formatting money', () => {
    it('formats minor units in the locale', () => {
        expect(formatMinorUnits(123456, 2, 'nl')).toBe('1.234,56')
        expect(formatMinorUnits(123456, 2, 'en')).toBe('1,234.56')
        expect(formatMinorUnits(null, 2, 'en')).toBe('')
    })

    it('finds the symbol and its side', () => {
        expect(moneyFormat('en', 'USD')).toMatchObject({ symbol: '$', symbolFirst: true, decimal: '.' })
        expect(moneyFormat('de', 'EUR')).toMatchObject({ symbol: '€', symbolFirst: false, decimal: ',' })
    })
})

describe('money field', () => {
    const schema = (field: Record<string, unknown> = {}, defaults: Record<string, unknown> = {}) => ({
        schemaVersion: '1.5',
        id: 'money',
        action: '/',
        method: 'post',
        defaults,
        locale: 'nl',
        fields: [{ name: 'amount_cents', type: 'money', label: 'Amount', currency: 'EUR', decimals: 2, ...field }],
    })

    const formOf = (wrapper: ReturnType<typeof mount>): any => (wrapper.vm as any).form

    it('shows stored cents as a localised amount with the symbol', () => {
        const wrapper = mount(Form, { props: { schema: schema({}, { amount_cents: 123450 }) } })

        expect((wrapper.find('input#amount_cents').element as HTMLInputElement).value).toBe('1.234,50')
        expect(wrapper.find('[data-money-symbol]').text()).toBe('€')
    })

    it('stores what is typed as whole cents', async () => {
        const wrapper = mount(Form, { props: { schema: schema() } })

        await wrapper.find('input#amount_cents').setValue('12,5')

        expect(formOf(wrapper).amount_cents).toBe(1250)
        expect(wrapper.find('input[type="hidden"][name="amount_cents"]').attributes('value')).toBe('1250')
    })

    it('tidies the amount on blur', async () => {
        const wrapper = mount(Form, { props: { schema: schema() } })
        const input = wrapper.find('input#amount_cents')

        await input.setValue('7')
        await input.trigger('blur')

        expect((input.element as HTMLInputElement).value).toBe('7,00')
    })

    it('follows the locale of the field over the form', async () => {
        const wrapper = mount(Form, { props: { schema: schema({ locale: 'en-US', currency: 'USD' }) } })

        await wrapper.find('input#amount_cents').setValue('1,234.5')

        expect(formOf(wrapper).amount_cents).toBe(123450)
    })

    it('keeps invalid text as typed and marks it', async () => {
        const wrapper = mount(Form, { props: { schema: schema() } })

        await wrapper.find('input#amount_cents').setValue('abc')

        expect(formOf(wrapper).amount_cents).toBe('abc')
        expect(wrapper.find('input#amount_cents').attributes('aria-invalid')).toBe('true')
    })

    it('empties when the form value is cleared', async () => {
        const wrapper = mount(Form, { props: { schema: schema({}, { amount_cents: 500 }) } })

        formOf(wrapper).amount_cents = null
        await nextTick()

        expect((wrapper.find('input#amount_cents').element as HTMLInputElement).value).toBe('')
    })
})
