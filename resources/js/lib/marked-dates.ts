import { calendarDateOf } from './dates'

export interface MarkedDate {
    from: string
    to?: string | null
    variant?: string
    label?: string
}

export interface MarkedDateSource {
    markedDates?: MarkedDate[]
    markedDatesUrl?: string
}

const requests = new Map<string, Promise<MarkedDate[]>>()

function leadingDate(value: unknown): string | null {
    const match = typeof value === 'string' ? /^\d{4}-\d{2}-\d{2}/.exec(value) : null

    return match ? match[0] : null
}

function toMarkedDate(value: unknown): MarkedDate | null {
    if (value === null || typeof value !== 'object') {
        return null
    }

    const candidate = value as Record<string, unknown>
    const from = leadingDate(candidate.from)

    if (!from) {
        return null
    }

    return {
        from,
        to: leadingDate(candidate.to),
        variant: typeof candidate.variant === 'string' && candidate.variant !== '' ? candidate.variant : undefined,
        label: typeof candidate.label === 'string' && candidate.label !== '' ? candidate.label : undefined,
    }
}

export function normalizeMarkedDates(payload: unknown): MarkedDate[] {
    if (!Array.isArray(payload)) {
        return []
    }

    return payload.map(toMarkedDate).filter((marked): marked is MarkedDate => marked !== null)
}

export function markedDateOn(date: Date, markedDates: MarkedDate[]): MarkedDate | null {
    const day = calendarDateOf(date)

    return markedDates.find((marked) => {
        const from = leadingDate(marked.from)

        if (!from) {
            return false
        }

        const to = leadingDate(marked.to) ?? from

        return day >= (from < to ? from : to) && day <= (from < to ? to : from)
    }) ?? null
}

export function markedVariantOf(marked: MarkedDate | null): string | undefined {
    return marked ? marked.variant ?? 'default' : undefined
}

export function markedDayClass(marked: MarkedDate | null, classes: Record<string, string>): string {
    if (!marked) {
        return ''
    }

    return classes[marked.variant ?? 'default'] ?? classes.default ?? ''
}

async function requestMarkedDates(url: string): Promise<MarkedDate[]> {
    const response = await fetch(url, {
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
    })

    if (!response.ok) {
        throw new Error(`Loading marked dates failed with status ${response.status}`)
    }

    return normalizeMarkedDates(await response.json())
}

export function fetchMarkedDates(url: string): Promise<MarkedDate[]> {
    const pending = requests.get(url)

    if (pending) {
        return pending
    }

    const request = requestMarkedDates(url)

    requests.set(url, request)
    request.catch(() => requests.delete(url))

    return request
}

export function forgetMarkedDates(url?: string): void {
    if (url === undefined) {
        requests.clear()

        return
    }

    requests.delete(url)
}
