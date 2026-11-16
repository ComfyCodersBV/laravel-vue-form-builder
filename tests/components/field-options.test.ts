import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import Form from '../../resources/js/components/Form.vue'
import { filterInput } from '../../resources/js/lib/input-filter'
import { expressionValue, meetsCondition } from '../../resources/js/lib/conditions'
import { toOptions } from '../../resources/js/lib/options'

const schemaWith = (fields: Array<Record<string, unknown>>, defaults: Record<string, unknown> = {}, id = 'options') => ({
    schemaVersion: '1.17',
    id,
    action: '/',
    method: 'post',
    defaults,
    fields,
})

const formOf = (wrapper: ReturnType<typeof mount>): any => (wrapper.vm as any).form

const units = [
    { value: 'hall', label: 'Hall' },
    { separator: true, disabled: true },
    { value: 'attic', label: 'Attic', disabled: true },
    { value: 'cellar', label: 'Cellar' },
]

describe('select with disabled options and a separator', () => {
    beforeEach(() => {
        vi.stubGlobal('ResizeObserver', class {
            observe(): void {}
            unobserve(): void {}
            disconnect(): void {}
        })
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        document.body.innerHTML = ''
    })

    it('reads value, label and disabled from option rows, also in a map', () => {
        expect(toOptions(units, 'name', 'id')).toEqual([
            { value: 'hall', label: 'Hall' },
            { value: '', label: '', separator: true, disabled: true },
            { value: 'attic', label: 'Attic', disabled: true },
            { value: 'cellar', label: 'Cellar' },
        ])
        expect(toOptions({ 1: 'Hall', 2: { label: 'Attic', disabled: true } }, 'name', 'id')).toEqual([
            { value: '1', label: 'Hall' },
            { value: '2', label: 'Attic', disabled: true },
        ])
    })

    it('does not pick a disabled option or a separator in the combobox', async () => {
        const wrapper = mount(Form, {
            attachTo: document.body,
            props: { schema: schemaWith([{ name: 'unit', type: 'select', searchable: true, options: units }]) },
        })

        await wrapper.find('button[id="options-unit"]').trigger('click')
        await flushPromises()

        expect(document.body.querySelectorAll('[data-select-separator]')).toHaveLength(1)

        const attic = document.body.querySelector<HTMLButtonElement>('[data-option-disabled]')!

        expect(attic.textContent?.trim()).toBe('Attic')
        expect(attic.disabled).toBe(true)

        attic.click()
        await nextTick()

        expect(formOf(wrapper).unit).toBe('')

        const cellar = Array.from(document.body.querySelectorAll<HTMLButtonElement>('.max-h-64 button')).find((button) => button.textContent?.trim() === 'Cellar')!
        cellar.click()
        await nextTick()

        expect(formOf(wrapper).unit).toBe('cellar')
    })

    it('hides the separator while searching', async () => {
        const wrapper = mount(Form, {
            attachTo: document.body,
            props: { schema: schemaWith([{ name: 'unit', type: 'select', searchable: true, options: units }]) },
        })

        await wrapper.find('button[id="options-unit"]').trigger('click')
        await flushPromises()

        const input = document.body.querySelector('[data-slot="popover-content"] input, [role="dialog"] input') as HTMLInputElement
        input.value = 'a'
        input.dispatchEvent(new Event('input', { bubbles: true }))
        await nextTick()

        expect(document.body.querySelectorAll('[data-select-separator]')).toHaveLength(0)
    })

    it('does not toggle a disabled option in a multi-select', async () => {
        const wrapper = mount(Form, {
            attachTo: document.body,
            props: { schema: schemaWith([{ name: 'units', type: 'select', multiple: true, options: units }]) },
        })

        await wrapper.find('button[type="button"]').trigger('click')
        await flushPromises()

        const attic = document.body.querySelector<HTMLButtonElement>('[data-option-disabled]')!

        expect(attic.disabled).toBe(true)
        expect(document.body.querySelectorAll('[data-select-separator]')).toHaveLength(1)
        expect(formOf(wrapper).units).toEqual([])
    })
})

describe('checkboxes as a table with select all', () => {
    const barrels = [
        { value: 1, label: 'Barrel 12', lot: 'P-1', barrel: '12' },
        { value: 2, label: 'Barrel 13', lot: 'P-1', barrel: '13', disabled: true },
        { value: 3, label: 'Barrel 14', lot: 'P-2', barrel: '14' },
    ]

    const mountTable = (defaults: Record<string, unknown> = {}) => mount(Form, {
        props: {
            schema: schemaWith([{
                name: 'barrels',
                type: 'checkboxes',
                options: barrels,
                optionColumns: [{ key: 'lot', label: 'Lot' }, { key: 'barrel', label: 'Barrel' }],
                selectAll: true,
                default: [],
            }], defaults),
        },
    })

    it('shows a row per option with its columns and a named checkbox', () => {
        const wrapper = mountTable()

        expect(wrapper.findAll('thead th').map((th) => th.text())).toEqual(['Select', 'Lot', 'Barrel'])
        expect(wrapper.find('[data-option="3"]').text()).toBe('P-214')
        expect(wrapper.find('[data-option="1"] button[role="checkbox"]').attributes('aria-label')).toBe('Barrel 12')
        expect(wrapper.find('[data-option="1"] label').attributes('for')).toBe('options-barrels-1')
    })

    it('selects every enabled option and none again, keeping a disabled choice', async () => {
        const wrapper = mountTable({ barrels: ['2'] })

        await wrapper.find('[data-select-all-button]').trigger('click')

        expect(formOf(wrapper).barrels).toEqual(['2', '1', '3'])
        expect(wrapper.find('[data-select-all-button]').attributes('disabled')).toBeDefined()

        await wrapper.find('[data-select-none-button]').trigger('click')

        expect(formOf(wrapper).barrels).toEqual(['2'])
        expect(wrapper.find('[data-select-none-button]').attributes('disabled')).toBeDefined()
    })

    it('labels the buttons in the language of the form', () => {
        const wrapper = mount(Form, {
            props: {
                locale: 'nl',
                schema: schemaWith([{ name: 'barrels', type: 'checkboxes', options: barrels, selectAll: true }]),
            },
        })

        expect(wrapper.find('[data-select-all]').text()).toContain('Alles kiezen')
        expect(wrapper.find('[data-select-all]').text()).toContain('Niets kiezen')
    })
})

describe('restricted input characters', () => {
    it('upper-cases before it drops characters outside the charset', () => {
        expect(filterInput('ab-12 c', { charset: 'A-Z0-9', uppercase: true })).toBe('AB12C')
        expect(filterInput('12a3', { charset: '0-9' })).toBe('123')
        expect(filterInput('abc', { uppercase: true })).toBe('ABC')
        expect(filterInput('a-b', { charset: 'z-a' })).toBe('a-b')
    })

    it('blocks typed and pasted characters and keeps the caret in place', async () => {
        const wrapper = mount(Form, {
            attachTo: document.body,
            props: { schema: schemaWith([{ name: 'code', type: 'text', charset: 'A-Z0-9', uppercase: true }]) },
        })

        const input = wrapper.find('input[name="code"]').element as HTMLInputElement
        input.focus()
        input.value = 'ab-x1'
        input.setSelectionRange(3, 3)
        input.dispatchEvent(new Event('input', { bubbles: true }))
        await nextTick()

        expect(input.value).toBe('ABX1')
        expect(input.selectionStart).toBe(2)
        expect(formOf(wrapper).code).toBe('ABX1')

        wrapper.unmount()
    })
})

describe('display field', () => {
    it('computes its text from other fields and stays out of the payload', async () => {
        const wrapper = mount(Form, {
            props: {
                schema: schemaWith([
                    { name: 'prefix', type: 'text' },
                    { name: 'number', type: 'text' },
                    { name: 'lot_preview', type: 'display', label: 'Lot', expression: 'prefix && number ? `${prefix}-${number}` : ""' },
                    { name: 'note', type: 'display', content: '<b>Static</b>' },
                ], { lot_preview: 'from the model', prefix: 'AB' }),
            },
        })

        await wrapper.find('input[name="number"]').setValue('12')

        expect(wrapper.find('output#options-lot_preview').text()).toBe('AB-12')
        expect(wrapper.find('label[for="options-lot_preview"]').text()).toBe('Lot')
        expect(wrapper.findAll('[data-display]')[1].text()).toBe('<b>Static</b>')
        expect(Object.keys(formOf(wrapper).data())).toEqual(['prefix', 'number'])
    })

    it('reads the fields of its own repeater row and adds nothing to the row', async () => {
        const wrapper = mount(Form, {
            props: {
                schema: schemaWith([{
                    name: 'lines',
                    type: 'repeater',
                    fields: [
                        { name: 'qty', type: 'text' },
                        { name: 'total', type: 'display', expression: 'qty * 2' },
                    ],
                }], { lines: [{ qty: '3' }] }),
            },
        })

        await wrapper.find('input[name="qty"]').setValue('4')

        expect(wrapper.find('[data-display]').text()).toBe('8')
        expect(formOf(wrapper).lines).toEqual([{ qty: '4' }])
    })

    it('shows nothing for an expression that fails', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

        expect(expressionValue('missing.deep', {})).toBe('')

        warn.mockRestore()
        expect(expressionValue('a + b', { a: 1, b: 2 })).toBe('3')
    })
})

describe('textarea rows and text suggestions', () => {
    it('sets the rows of a textarea', () => {
        const wrapper = mount(Form, { props: { schema: schemaWith([{ name: 'notes', type: 'textarea', rows: 4 }]) } })

        expect(wrapper.find('textarea').attributes('rows')).toBe('4')
    })

    it('gives every datalist an id of its own form and repeater row', () => {
        const fields = [
            { name: 'prefix', type: 'text', suggestions: ['AB', 'CD'] },
            { name: 'lines', type: 'repeater', fields: [{ name: 'prefix', type: 'text', suggestions: ['EF'] }] },
        ]
        const wrapper = mount(defineComponent({
            render: () => h('div', [
                h(Form, { schema: schemaWith(fields, { lines: [{ prefix: '' }, { prefix: '' }] }, 'first') }),
                h(Form, { schema: schemaWith(fields, {}, 'second') }),
            ]),
        }))

        const lists = wrapper.findAll('datalist').map((list) => list.attributes('id'))

        expect(lists).toEqual([
            'first-prefix-suggestions',
            'first-lines-0-prefix-suggestions',
            'first-lines-1-prefix-suggestions',
            'second-prefix-suggestions',
        ])
        expect(new Set(lists).size).toBe(lists.length)
        expect(wrapper.findAll('input[list]').map((input) => input.attributes('list'))).toEqual(lists)
        expect(wrapper.find('datalist').findAll('option').map((option) => option.attributes('value'))).toEqual(['AB', 'CD'])
    })
})

describe('expressions on forms with dotted field names', () => {
    it('reads a dotted field as a nested value and by its full name', () => {
        const data = { 'address.city': 'Delft', 'address.street': 'Markt', class: 'x', name: 'Jan' }

        expect(meetsCondition({ condition: 'address.city === "Delft"' }, data)).toBe(true)
        expect(meetsCondition({ condition: 'form["address.street"] === "Markt" && name === "Jan"' }, data)).toBe(true)
        expect(expressionValue('`${address.street}, ${address.city}`', data)).toBe('Markt, Delft')
        expect(data).toEqual({ 'address.city': 'Delft', 'address.street': 'Markt', class: 'x', name: 'Jan' })
    })

    it('keeps a nested object the data already carries', () => {
        const data = { address: { country: 'NL' }, 'address.city': 'Delft' }

        expect(expressionValue('address.country + address.city', data)).toBe('NLDelft')
        expect(data.address).toEqual({ country: 'NL' })
    })

    it('hides a field whose condition fails instead of showing it, with a warning', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

        expect(meetsCondition({ condition: 'missing.deep === 1' }, {})).toBe(false)
        expect(meetsCondition({ condition: 'this is not javascript' }, {})).toBe(false)
        expect(warn).toHaveBeenCalledTimes(2)

        warn.mockRestore()
    })

    it('keeps form for the form itself and skips unsafe dotted names', () => {
        const data = { form: 'field', 'a.toString': 'x', '__proto__.polluted': 'y', 'b.c': 'z' }

        expect(meetsCondition({ condition: 'form.form === "field" && a.toString === "x" && b.c === "z"' }, data)).toBe(true)
        expect(meetsCondition({ condition: 'typeof polluted === "undefined"' }, data)).toBe(true)
        expect(({} as Record<string, unknown>).polluted).toBeUndefined()
    })

    it('shows a field that depends on a dotted field in a form', async () => {
        const wrapper = mount(Form, {
            props: {
                schema: schemaWith([
                    { name: 'address.country', type: 'text' },
                    { name: 'vat', type: 'text', condition: "address.country === 'NL'" },
                ]),
            },
        })

        expect(wrapper.find('input[name="vat"]').exists()).toBe(false)

        await wrapper.find('input[name="address.country"]').setValue('NL')

        expect(wrapper.find('input[name="vat"]').exists()).toBe(true)
    })
})

describe('checkbox option keys', () => {
    it('reads the value and label from the keys the field names', () => {
        const wrapper = mount(Form, {
            props: {
                schema: schemaWith([{
                    name: 'users',
                    type: 'checkboxes',
                    optionValue: 'uuid',
                    optionLabel: 'full_name',
                    options: [{ uuid: 'a1', full_name: 'Jane Doe', id: 9 }],
                    default: [],
                }]),
            },
        })

        expect(wrapper.find('#options-users-a1').exists()).toBe(true)
        expect(wrapper.find('label[for="options-users-a1"]').text()).toBe('Jane Doe')
    })

    it('falls back to id and name, and keeps value and label rows working', () => {
        const wrapper = mount(Form, {
            props: {
                schema: schemaWith([
                    { name: 'roles', type: 'checkboxes', options: [{ id: 3, name: 'Admin' }], default: [] },
                    { name: 'plans', type: 'checkboxes', options: [{ value: 'pro', label: 'Pro', id: 7 }], default: [] },
                ]),
            },
        })

        expect(wrapper.find('label[for="options-roles-3"]').text()).toBe('Admin')
        expect(wrapper.find('label[for="options-plans-pro"]').text()).toBe('Pro')
    })
})

describe('labels of grouped fields', () => {
    beforeEach(() => {
        vi.stubGlobal('ResizeObserver', class {
            observe(): void {}
            unobserve(): void {}
            disconnect(): void {}
        })
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('names a checkbox group after its label instead of pointing at a missing id', () => {
        const wrapper = mount(Form, {
            props: { schema: schemaWith([{ name: 'roles', type: 'checkboxes', label: 'Roles', options: ['a', 'b'], default: [] }]) },
        })

        const label = wrapper.find('label')

        expect(label.attributes('for')).toBeUndefined()
        expect(label.attributes('id')).toBe('options-roles--label')
        expect(wrapper.find('[role="group"]').attributes('aria-labelledby')).toBe('options-roles--label')
    })

    it('points the label of a multi-select at its trigger', () => {
        const wrapper = mount(Form, {
            props: { schema: schemaWith([{ name: 'tags', type: 'select', label: 'Tags', multiple: true, options: ['a', 'b'] }]) },
        })

        const target = wrapper.find('label').attributes('for')

        expect(target).toBe('options-tags')
        expect(wrapper.find(`button#${target}`).exists()).toBe(true)
    })
})
