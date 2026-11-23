import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import DatePicker from '../../resources/js/components/ui/date-picker/DatePicker.vue'
import TouchDatePicker from '../../resources/js/components/ui/date-picker/TouchDatePicker.vue'
import { fetchMarkedDates, forgetMarkedDates, markedDateOn, normalizeMarkedDates, type MarkedDate } from '../../resources/js/lib/marked-dates'

const day = (value: string) => {
    const [year, month, date] = value.split('-').map(Number)

    return new Date(year, month - 1, date)
}

describe('marked date matching', () => {
    const marked: MarkedDate[] = [
        { from: '2026-12-25', to: null, label: 'Christmas' },
        { from: '2026-07-20', to: '2026-08-02', variant: 'muted', label: 'Requested' },
        { from: '2026-10-10', to: '2026-10-05' },
        { from: '2026-12-24T00:00:00+01:00' },
    ]

    it.each([
        ['2026-12-25', 'Christmas'],
        ['2026-12-26', null],
        ['2026-07-20', 'Requested'],
        ['2026-07-31', 'Requested'],
        ['2026-08-02', 'Requested'],
        ['2026-08-03', null],
        ['2026-10-07', undefined],
        ['2026-12-24', undefined],
    ])('finds the mark of %s', (date, label) => {
        const found = markedDateOn(day(date), marked)

        if (label === null) {
            expect(found).toBeNull()

            return
        }

        expect(found?.label).toBe(label)
    })

    it('keeps only entries with a from date', () => {
        expect(normalizeMarkedDates([
            { from: '2026-12-25 10:00', to: '', variant: '', label: 'Leave' },
            { to: '2026-12-31' },
            'nonsense',
            null,
        ])).toEqual([{ from: '2026-12-25', to: null, variant: undefined, label: 'Leave' }])

        expect(normalizeMarkedDates({ data: [] })).toEqual([])
    })
})

describe('fetching marked dates', () => {
    afterEach(() => {
        forgetMarkedDates()
        vi.unstubAllGlobals()
    })

    it('fetches a url once and retries after a failure', async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(new Response('', { status: 500 }))
            .mockResolvedValueOnce(Response.json([{ from: '2026-11-02', to: '2026-11-04' }]))

        vi.stubGlobal('fetch', fetchMock)

        await expect(fetchMarkedDates('/marked')).rejects.toThrow()
        expect(await fetchMarkedDates('/marked')).toEqual([{ from: '2026-11-02', to: '2026-11-04', variant: undefined, label: undefined }])
        await fetchMarkedDates('/marked')

        expect(fetchMock).toHaveBeenCalledTimes(2)
    })
})

describe('marked dates in the pickers', () => {
    beforeAll(() => {
        vi.stubGlobal('ResizeObserver', class {
            observe(): void {}
            unobserve(): void {}
            disconnect(): void {}
        })
    })

    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json([
            { from: '2026-11-10', to: '2026-11-12', label: 'Approved leave' },
            { from: '2026-11-16', to: null, variant: 'muted', label: 'Requested leave' },
        ])))
    })

    afterEach(() => {
        forgetMarkedDates()
        document.body.innerHTML = ''
    })

    const cell = (date: string) => document.body.querySelector<HTMLButtonElement>(`button[data-date="${date}"]`)!

    it('fetches only when the picker opens and marks the days, which stay selectable', async () => {
        const wrapper = mount(DatePicker, {
            attachTo: document.body,
            props: { modelValue: '2026-11-03', markedDatesUrl: '/leave/marked', markedDates: [{ from: '2026-11-20', label: 'Holiday' }] },
        })

        await flushPromises()
        expect(fetch).not.toHaveBeenCalled()

        await wrapper.find('button').trigger('click')
        await flushPromises()

        expect(fetch).toHaveBeenCalledTimes(1)
        expect(cell('2026-11-11').dataset.marked).toBe('default')
        expect(cell('2026-11-11').title).toBe('Approved leave')
        expect(cell('2026-11-16').dataset.marked).toBe('muted')
        expect(cell('2026-11-20').title).toBe('Holiday')
        expect(cell('2026-11-13').dataset.marked).toBeUndefined()

        cell('2026-11-11').click()
        await flushPromises()

        expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['2026-11-11'])
    })

    it('shares the response with every touch picker on the page', async () => {
        const first = mount(TouchDatePicker, { attachTo: document.body, props: { modelValue: '2026-11-03', markedDatesUrl: '/leave/marked' } })
        const second = mount(TouchDatePicker, { attachTo: document.body, props: { modelValue: '2026-11-03', markedDatesUrl: '/leave/marked' } })

        await first.find('[data-touch-date]').trigger('click')
        await flushPromises()
        await second.find('[data-touch-date]').trigger('click')
        await flushPromises()

        expect(fetch).toHaveBeenCalledTimes(1)
        expect(cell('2026-11-16').getAttribute('aria-label')).toContain('Requested leave')
        expect(cell('2026-11-16').dataset.marked).toBe('muted')
    })
})
