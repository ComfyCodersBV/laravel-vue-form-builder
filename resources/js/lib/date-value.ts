import { isUnavailableDate, type DisabledDate } from './dates'
import { parseFormattedDate } from './date-format'
import { dateOfWallClock, toDisplayWallClock, toZonedIso, wallClockOfDate } from './timezone'

export interface DateValueContext {
    zone: string | null
    serverTimezone?: string
    format: string
    locale?: string
}

export interface DateAvailability {
    minDate?: string
    maxDate?: string
    disabledWeekdays?: number[]
    disabledDates?: DisabledDate[]
}

function pad(value: number): string {
    return value < 10 ? `0${value}` : String(value)
}

export function formatDateValue(date: Date | null, withTime: boolean, zone: string | null): string | null {
    if (!date) {
        return null
    }

    if (withTime && zone) {
        return toZonedIso(wallClockOfDate(date), zone)
    }

    const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

    if (!withTime) {
        return day
    }

    return `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function parseDateValue(value: string | null, withTime: boolean, context: DateValueContext): Date | null {
    if (!value) {
        return null
    }

    if (withTime && context.zone) {
        const wall = toDisplayWallClock(value, context.zone, context.serverTimezone)

        return wall ? dateOfWallClock(wall) : null
    }

    if (value.includes('T')) {
        const parsed = new Date(value)

        return Number.isNaN(parsed.getTime()) ? null : parsed
    }

    const [datePart, timePart] = value.split(' ')
    const segments = datePart.split('-')

    if (segments.length !== 3 || !/^\d{4}$/.test(segments[0]) || !/^\d{1,2}$/.test(segments[1]) || !/^\d{1,2}$/.test(segments[2])) {
        return context.format === 'locale' ? null : parseFormattedDate(value, context.format, context.locale)
    }

    const [year, month, day] = segments.map(Number)

    if (month < 1 || month > 12 || day < 1 || day > 31) {
        return null
    }

    const parsed = new Date(year, month - 1, day)

    if (withTime && timePart) {
        const [hours, minutes] = timePart.split(':').map(Number)

        if (!Number.isNaN(hours)) {
            parsed.setHours(hours)
        }

        if (!Number.isNaN(minutes)) {
            parsed.setMinutes(minutes)
        }
    }

    return parsed
}

function startOfDay(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

export function isSameDay(first: Date | null, second: Date): boolean {
    return first !== null && startOfDay(first) === startOfDay(second)
}

export function isDisabledDay(date: Date, availability: DateAvailability, withTime: boolean, context: DateValueContext): boolean {
    if (isUnavailableDate(date, availability.disabledWeekdays, availability.disabledDates)) {
        return true
    }

    const day = startOfDay(date)
    const min = availability.minDate ? parseDateValue(availability.minDate, withTime, context) : null
    const max = availability.maxDate ? parseDateValue(availability.maxDate, withTime, context) : null

    if (min && day < startOfDay(min)) {
        return true
    }

    return max !== null && day > startOfDay(max)
}

export function monthGrid(year: number, month: number, weekStartsOn: number): Array<Array<{ date: Date; inMonth: boolean }>> {
    const first = new Date(year, month, 1)
    const lead = (first.getDay() - (weekStartsOn === 1 ? 1 : 0) + 7) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: Array<{ date: Date; inMonth: boolean }> = []

    for (let i = 0; i < lead; i++) {
        cells.unshift({ date: new Date(year, month, -i), inMonth: false })
    }

    for (let day = 1; day <= daysInMonth; day++) {
        cells.push({ date: new Date(year, month, day), inMonth: true })
    }

    while (cells.length % 7 !== 0) {
        const next = new Date(cells[cells.length - 1].date)
        next.setDate(next.getDate() + 1)
        cells.push({ date: next, inMonth: false })
    }

    return Array.from({ length: cells.length / 7 }, (_, row) => cells.slice(row * 7, row * 7 + 7))
}

export function weekdayLabels(locale: string | undefined, weekStartsOn: number): string[] {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' })
    const labels = Array.from({ length: 7 }, (_, i) => formatter.format(new Date(2023, 0, 1 + i)))

    return weekStartsOn === 1 ? [...labels.slice(1), labels[0]] : labels
}
