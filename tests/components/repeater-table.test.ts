import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
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
    it('keeps the elements of an inline row with that row when the rows are reordered', async () => {
        const wrapper = mount(Form, {
            props: { schema: schemaWith([barrels({ table: false, inline: true, reorderable: true })], twoRows) },
        })

        const firstRow = wrapper.findAll('[data-repeater-row]')[0].element

        await wrapper.findAll('[data-repeater-row]')[0].find('button[aria-label="Move down"]').trigger('click')

        expect(wrapper.findAll('[data-repeater-row]')[1].element).toBe(firstRow)
        expect(formOf(wrapper).barrels.map((row: Record<string, unknown>) => row.number)).toEqual(['2', '1'])
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
