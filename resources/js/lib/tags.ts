export const TAG_SEPARATOR_PATTERN = /[,;\r\n]+/

const EMAIL_PATTERN = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]+$/

export interface TagSuggestion {
    value: string
    label: string
}

export function splitTags(input: string): string[] {
    return input.split(TAG_SEPARATOR_PATTERN).map((entry) => entry.trim()).filter((entry) => entry !== '')
}

export function normalizeTags(value: unknown): string[] {
    if (value === null || typeof value === 'undefined' || value === '') {
        return []
    }

    const entries = typeof value === 'string'
        ? splitTags(value)
        : Array.isArray(value)
            ? value.filter((entry) => typeof entry === 'string' || typeof entry === 'number').map((entry) => String(entry).trim())
            : []

    return [...new Set(entries.filter((entry) => entry !== ''))]
}

export function addTags(current: string[], additions: string[], max?: number): string[] {
    const merged = normalizeTags([...current, ...additions])

    if (!max || max < 1) {
        return merged
    }

    return merged.slice(0, Math.max(max, current.length))
}

export function isEmailAddress(value: string): boolean {
    return EMAIL_PATTERN.test(value)
}

export function isTagSuggestion(value: unknown): value is TagSuggestion {
    if (value === null || typeof value !== 'object') {
        return false
    }

    const candidate = value as Record<string, unknown>

    return (typeof candidate.value === 'string' || typeof candidate.value === 'number')
        && (typeof candidate.label === 'string' || typeof candidate.label === 'undefined')
}

export function showsSuggestionValue(suggestion: TagSuggestion): boolean {
    const label = suggestion.label.toLowerCase()
    const value = String(suggestion.value).toLowerCase()

    return label !== value && !label.includes(`<${value}>`)
}

export function suggestionsRequestUrl(url: string, query: string, base?: string): string {
    const resolved = new URL(url, base ?? (typeof window === 'undefined' ? 'http://localhost' : window.location.href))

    resolved.searchParams.set('q', query)

    return resolved.toString()
}
