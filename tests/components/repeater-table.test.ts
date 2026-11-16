import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import Form from '../../resources/js/components/Form.vue'

const barrels = (extra: Record<string, unknown> = {}) => ({
    name: 'barrels',
    type: 'repeater',
    table: true,
    fields: [
        { name: 'number', type: 'text', label: 'Vat', markRequired: true, columnWidth: '6rem' },
        { name: 'caliber', type: 'select', label: 'Kaliber', helpText: 'Mm', options: { '36': '36/38', '38': '38/40' } },
        { name: 'remark', type: 'text', label: 'Opmerking' },
        { name: 'lot_id', type: 'hidden' },
    ],
    ...extra,
})

const schemaWith = (fields: Array<Record<string, unknown>>, defaults: Record<string, unknown> = {}) => ({
    schemaVersion: '1.16',
    id: 'bookin',
    action: '/',
    method: 'post',
    defaults,
    fields,
})

const twoRows = {
    barrels: [
        { number: '1', caliber: '36', remark: 'first', lot_id: 5 },
        { number: '2', caliber: '38', remark: 'second', lot_id: 5 },
    ],
}

const formOf = (wrapper: ReturnType<typeof mount>): any => (wrapper.vm as any).form

describe('repeater table', () => {
    it('shows the labels once in a header and one row per item', () => {
        const wrapper = mount(Form, { props: { schema: schemaWith([barrels()], twoRows) } })

        const headers = wrapper.findAll('[data-repeater-table] thead th')

        expect(headers.map((header) => header.text())).toEqual(['Vat* (required)', 'KaliberMm', 'Opmerking', 'Actions'])
        expect(wrapper.findAll('[data-repeater-table] tbody tr')).toHaveLength(2)
        expect(wrapper.findAll('[data-repeater-table] tbody [data-help-text]')).toHaveLength(0)
        expect(wrapper.findAll('[data-repeater-table] tbody [data-required-mark]').every((mark) => mark.element.closest('label')?.classList.contains('sr-only'))).toBe(true)
    })

    it('keeps an accessible name on every input through a visually hidden label', () => {
        const wrapper = mount(Form, { props: { schema: schemaWith([barrels()], twoRows) } })

        const input = wrapper.find('#bookin-barrels-1-remark')
        const label = wrapper.find('label[for="bookin-barrels-1-remark"]')

        expect(input.exists()).toBe(true)
        expect(label.text()).toBe('Opmerking')
        expect(label.classes()).toContain('sr-only')
    })

    it('describes each input by the help in its header', () => {
        const wrapper = mount(Form, { props: { schema: schemaWith([barrels()], twoRows) } })

        const help = wrapper.find('[data-repeater-table] thead [data-help-text]')

        expect(help.attributes('id')).toBe('bookin-barrels-column-caliber-help')
        expect(wrapper.find('#bookin-barrels-1-caliber').attributes('aria-describedby')).toBe('bookin-barrels-column-caliber-help')
        expect(wrapper.find('#bookin-barrels-1-remark').attributes('aria-describedby')).toBeUndefined()
    })

    it('keeps the currency in the description of a money cell next to the header help', () => {
        const repeater = {
            name: 'lines',
            type: 'repeater',
            table: true,
            fields: [{ name: 'price', type: 'money', label: 'Price', helpText: 'Per kilo', currency: 'EUR' }],
        }
        const wrapper = mount(Form, { props: { schema: schemaWith([repeater], { lines: [{ price: 100 }] }) } })

        expect(wrapper.find('#bookin-lines-0-price').attributes('aria-describedby')).toBe('bookin-lines-column-price-help bookin-lines-0-price-currency')
    })

    it('names the actions column and the remove button of every row', () => {
        const wrapper = mount(Form, { props: { schema: schemaWith([barrels()], twoRows) } })

        const headers = wrapper.findAll('[data-repeater-table] thead th')
        const removeButtons = wrapper.findAll('[data-repeater-table] tbody button[aria-label^="Remove"]').map((button) => button.attributes('aria-label'))

        expect(headers[headers.length - 1].text()).toBe('Actions')
        expect(removeButtons).toEqual(['Remove row 1', 'Remove row 2'])
    })

    it('leaves the cell of a hidden sub-field empty and keeps its header', () => {
        const repeater = {
            name: 'barrels',
            type: 'repeater',
            table: true,
            fields: [
                { name: 'number', type: 'text', label: 'Vat' },
                { name: 'reason', type: 'text', label: 'Reason', condition: "number === '2'" },
            ],
        }
        const wrapper = mount(Form, {
            props: { schema: schemaWith([repeater], { barrels: [{ number: '1', reason: '' }, { number: '2', reason: '' }] }) },
        })

        const rows = wrapper.findAll('[data-repeater-table] tbody tr')

        expect(wrapper.findAll('[data-repeater-table] thead th').map((header) => header.text())).toContain('Reason')
        expect(rows[0].findAll('td')).toHaveLength(3)
        expect(rows[0].findAll('td')[1].find('input').exists()).toBe(false)
        expect(rows[1].findAll('td')[1].find('input[name="reason"]').exists()).toBe(true)
    })

    it('applies the column widths and keeps hidden sub-fields out of the columns', () => {
        const wrapper = mount(Form, { props: { schema: schemaWith([barrels()], twoRows) } })

        const columns = wrapper.findAll('[data-repeater-table] col')

        expect(columns).toHaveLength(4)
        expect(columns[0].attributes('style')).toContain('width: 6rem')
        expect(columns[1].attributes('style')).toBeUndefined()
        expect(wrapper.find('[data-repeater-table] table').attributes('style')).toContain('min-width: calc(25rem)')
        expect(wrapper.findAll('input[type="hidden"][name="lot_id"]')).toHaveLength(2)
    })

    it('shows an error under the cell it belongs to', async () => {
        const wrapper = mount(Form, { props: { schema: schemaWith([barrels()], twoRows) } })

        formOf(wrapper).setError({ 'barrels.1.remark': 'Too long.' })
        await nextTick()

        const cells = wrapper.findAll('[data-repeater-table] tbody tr')[1].findAll('td')

        expect(cells[2].text()).toContain('Too long.')
        expect(cells[0].text()).not.toContain('Too long.')
        expect(wrapper.findAll('[data-repeater-table] tbody tr')[0].text()).not.toContain('Too long.')
    })

    it('keeps the elements of a row with that row when another row is removed', async () => {
        const wrapper = mount(Form, { props: { schema: schemaWith([barrels()], twoRows) }, attachTo: document.body })

        const secondRow = wrapper.findAll('[data-repeater-row]')[1].element

        await wrapper.findAll('[data-repeater-row]')[0].find('button[aria-label="Remove row 1"]').trigger('click')

        const rows = wrapper.findAll('[data-repeater-row]')

        expect(rows).toHaveLength(1)
        expect(rows[0].element).toBe(secondRow)
        expect((rows[0].find('input[name="remark"]').element as HTMLInputElement).value).toBe('second')

        wrapper.unmount()
    })

    it('keeps the elements of an inline row with that row when the rows are reordered', async () => {
        const wrapper = mount(Form, {
            props: { schema: schemaWith([barrels({ table: false, inline: true, reorderable: true })], twoRows) },
        })

        const firstRow = wrapper.findAll('[data-repeater-row]')[0].element

        await wrapper.findAll('[data-repeater-row]')[0].find('button[aria-label="Move down"]').trigger('click')

        expect(wrapper.findAll('[data-repeater-row]')[1].element).toBe(firstRow)
        expect(formOf(wrapper).barrels.map((row: Record<string, unknown>) => row.number)).toEqual(['2', '1'])
    })

    it('reads a toggle in the same row as a boolean in the condition of a cell', () => {
        const repeater = {
            name: 'barrels',
            type: 'repeater',
            table: true,
            fields: [
                { name: 'fragile', type: 'toggle', label: 'Fragile' },
                { name: 'reason', type: 'text', label: 'Reason', condition: 'fragile' },
            ],
        }
        const wrapper = mount(Form, {
            props: { schema: schemaWith([repeater], { barrels: [{ fragile: '0', reason: '' }, { fragile: '1', reason: '' }] }) },
        })

        expect(wrapper.findAll('input[name="reason"]')).toHaveLength(1)
        expect(wrapper.find('#bookin-barrels-1-reason').exists()).toBe(true)
    })

    it('sends only the sub-fields of a row, without a row key', async () => {
        const wrapper = mount(Form, { props: { schema: schemaWith([barrels()], twoRows) } })

        await wrapper.find('[data-testid="field-barrels-add"]').trigger('click')

        const rows = formOf(wrapper).barrels

        expect(rows).toHaveLength(3)
        expect(rows.map((row: Record<string, unknown>) => Object.keys(row))).toEqual([
            ['number', 'caliber', 'remark', 'lot_id'],
            ['number', 'caliber', 'remark', 'lot_id'],
            ['number', 'caliber', 'remark', 'lot_id'],
        ])
    })
})
