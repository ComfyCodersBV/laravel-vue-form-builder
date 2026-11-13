import type { Field } from '../types/form-builder'
import { flattenFields } from './fields'
import { withoutParam } from './step-param'

export interface RememberedForm {
    values: Record<string, unknown>
    step?: string
}

const PREFIX = 'form-builder:'

const FORGOTTEN_TYPES = ['password', 'file', 'hidden', 'recaptcha']

const restoredKeys = new Set<string>()

function currentUrl(ignoredParam?: string): string {
    return `${window.location.pathname}${withoutParam(window.location.search, ignoredParam)}`
}

function storage(): Storage | null {
    try {
        return typeof window === 'undefined' ? null : window.sessionStorage
    } catch {
        return null
    }
}

export function rememberKey(remember: boolean | string | undefined, formId: string | undefined, ignoredParam?: string): string | null {
    if (!remember || typeof window === 'undefined') {
        return null
    }

    const name = typeof remember === 'string' ? remember : (formId || 'form')

    return `${PREFIX}${name}:${currentUrl(ignoredParam)}`
}

export function rememberedFieldNames(fields: Field[]): string[] {
    return flattenFields(fields)
        .filter((field) => typeof field.name === 'string' && field.name !== '' && !FORGOTTEN_TYPES.includes(field.type ?? ''))
        .map((field) => field.name as string)
}

function documentWasReloaded(ignoredParam?: string): boolean {
    const [entry] = typeof performance === 'undefined' || typeof performance.getEntriesByType !== 'function'
        ? []
        : performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]

    if (!entry || !['reload', 'back_forward'].includes(entry.type)) {
        return false
    }

    try {
        const loaded = new URL(entry.name)

        return `${loaded.pathname}${withoutParam(loaded.search, ignoredParam)}` === currentUrl(ignoredParam)
    } catch {
        return false
    }
}

function parse(raw: string | null): RememberedForm | null {
    if (!raw) {
        return null
    }

    try {
        const parsed = JSON.parse(raw)

        if (parsed === null || typeof parsed !== 'object' || typeof parsed.values !== 'object' || parsed.values === null) {
            return null
        }

        return {
            values: parsed.values,
            step: typeof parsed.step === 'string' ? parsed.step : undefined,
        }
    } catch {
        return null
    }
}

export function takeRemembered(key: string | null, names: string[], ignoredParam?: string): RememberedForm | null {
    const store = storage()

    if (!key || !store) {
        return null
    }

    if (restoredKeys.has(key) || !documentWasReloaded(ignoredParam)) {
        forgetRemembered(key)

        return null
    }

    restoredKeys.add(key)

    let remembered: RememberedForm | null

    try {
        remembered = parse(store.getItem(key))
    } catch {
        return null
    }

    if (!remembered) {
        return null
    }

    return {
        values: Object.fromEntries(Object.entries(remembered.values).filter(([name]) => names.includes(name))),
        step: remembered.step,
    }
}

export function writeRemembered(key: string | null, remembered: RememberedForm): void {
    if (!key) {
        return
    }

    try {
        storage()?.setItem(key, JSON.stringify(remembered))
    } catch {
        return
    }
}

export function forgetRemembered(key: string | null): void {
    if (!key) {
        return
    }

    try {
        storage()?.removeItem(key)
    } catch {
        return
    }
}
