import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DatePicker from '../../resources/js/components/ui/date-picker/DatePicker.vue'
import { formatDate, formatHasTime, isUnavailableDate, parseFormattedDate, type DisabledDate } from '../../resources/js/types/dates'

const afternoon = new Date(2026, 9, 4, 14, 5, 9)
const morning = new Date(2026, 0, 9, 0, 7, 3)

describe('formatDate', () => {
    it.each([
        ['YYYY-MM-DD', '2026-10-04'],
        ['DD/MM/YYYY', '04/10/2026'],
        ['YYYY-MM-DD HH:mm', '2026-10-04 14:05'],
        ['YY M D', '26 10 4'],
        ['d', '0'],
        ['dddd D MMMM YYYY', 'Sunday 4 October 2026'],
        ['ddd D MMM', 'Sun 4 Oct'],
        ['dd', 'Su'],
        ['H:m:s', '14:5:9'],
        ['HH:mm:ss.SSS', '14:05:09.000'],
        ['h:mm A', '2:05 PM'],
        ['hh:mm a', '02:05 pm'],
        ['[Week of] D MMM', 'Week of 4 Oct'],
    ])('formats %s', (format, expected) => {
        expect(formatDate(afternoon, format, 'en-GB')).toBe(expected)
    })

    it('says midnight is twelve am', () => {
        expect(formatDate(morning, 'h:mm a', 'en')).toBe('12:07 am')
    })

    it('localises month and day names', () => {
        expect(formatDate(afternoon, 'dddd D MMMM', 'nl')).toBe('zondag 4 oktober')
    })

    it('knows whether a format shows the time', () => {
        expect(formatHasTime('DD-MM-YYYY HH:mm')).toBe(true)
        expect(formatHasTime('D MMM h A')).toBe(true)
        expect(formatHasTime('D MMM [at noon]')).toBe(false)
    })
})

describe('parseFormattedDate', () => {
    it.each([
        ['04/10/2026', 'DD/MM/YYYY', new Date(2026, 9, 4)],
        ['4-10-26', 'D-M-YY', new Date(2026, 9, 4)],
        ['Sunday 4 October 2026', 'dddd D MMMM YYYY', new Date(2026, 9, 4)],
        ['4 oct 2026', 'D MMM YYYY', new Date(2026, 9, 4)],
        ['04/10/2026 2:05 PM', 'DD/MM/YYYY h:mm A', new Date(2026, 9, 4, 14, 5)],
        ['04/10/2026 12:07 am', 'DD/MM/YYYY hh:mm a', new Date(2026, 9, 4, 0, 7)],
    ])('reads %s as %s', (value, format, expected) => {
        expect(parseFormattedDate(value, format, 'en-GB')?.getTime()).toBe(expected.getTime())
    })

    it.each([
        ['31/02/2026', 'DD/MM/YYYY'],
        ['2026-10-04', 'DD/MM/YYYY'],
        ['4 Foo 2026', 'D MMM YYYY'],
    ])('refuses %s for %s', (value, format) => {
        expect(parseFormattedDate(value, format, 'en-GB')).toBeNull()
    })

    it('reads localised month names', () => {
        expect(parseFormattedDate('4 oktober 2026', 'D MMMM YYYY', 'nl')?.getTime()).toBe(new Date(2026, 9, 4).getTime())
    })
})

describe('date picker formats', () => {
    const display = (props: Record<string, unknown>) => mount(DatePicker, { props }).find('button').text()

    it('keeps the supported formats as they were', () => {
        expect(display({ modelValue: '2026-10-04', format: 'DD-MM-YYYY' })).toBe('04-10-2026')
        expect(display({ modelValue: '2026-10-04 14:05', format: 'YYYY/MM/DD', enableTime: true })).toBe('2026/10/04 14:05')
        expect(display({ modelValue: '2026-10-04 14:05', format: 'DD-MM-YYYY HH:mm', enableTime: true })).toBe('04-10-2026 14:05')
    })

    it('shows names in the picker locale', () => {
        expect(display({ modelValue: '2026-10-04', format: 'ddd D MMM YYYY', locale: 'en-GB' })).toBe('Sun 4 Oct 2026')
        expect(display({ modelValue: '2026-10-04 14:05', format: 'D MMMM, h:mm a', locale: 'en', enableTime: true })).toBe('4 October, 2:05 pm')
    })

    it('reads a value stored in its own format', () => {
        expect(display({ modelValue: '04/10/2026', format: 'DD/MM/YYYY' })).toBe('04/10/2026')
    })
})

describe('types entry point', () => {
    it('exposes the date helpers next to the types', () => {
        const closed: DisabledDate[] = [{ from: '2026-10-01', to: '2026-10-10' }]

        expect(isUnavailableDate(afternoon, [], closed)).toBe(true)
    })
})
