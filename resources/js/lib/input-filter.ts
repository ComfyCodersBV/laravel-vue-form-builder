export interface InputFilter {
    charset?: string
    uppercase?: boolean
}

const patterns = new Map<string, RegExp | null>()

function disallowedPattern(charset: string): RegExp | null {
    if (patterns.has(charset)) {
        return patterns.get(charset) ?? null
    }

    let pattern: RegExp | null = null

    try {
        pattern = new RegExp(`[^${charset}]`, 'gu')
    } catch {
        pattern = null
    }

    patterns.set(charset, pattern)

    return pattern
}

export function hasInputFilter(filter: InputFilter): boolean {
    return Boolean(filter.uppercase) || Boolean(filter.charset)
}

export function filterInput(value: string, filter: InputFilter): string {
    const cased = filter.uppercase ? value.toUpperCase() : value
    const pattern = filter.charset ? disallowedPattern(filter.charset) : null

    return pattern ? cased.replace(pattern, '') : cased
}

export function applyInputFilter(element: HTMLInputElement, filter: InputFilter): boolean {
    const raw = element.value
    const filtered = filterInput(raw, filter)

    if (filtered === raw) {
        return false
    }

    const caret = element.selectionEnd

    element.value = filtered

    if (caret === null || document.activeElement !== element) {
        return true
    }

    const position = filterInput(raw.slice(0, caret), filter).length

    element.setSelectionRange(position, position)

    return true
}
