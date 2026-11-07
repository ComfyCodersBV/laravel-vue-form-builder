export interface SelectOption {
    value: string | number
    label: string
    group?: string
}

export interface OptionGroup {
    label: string | null
    options: SelectOption[]
}

export type OptionsInput = Record<string, unknown> | Array<unknown>

function readProperty(item: Record<string, unknown>, key: string): unknown {
    if (key in item) {
        return item[key]
    }

    return undefined
}

function groupOf(item: Record<string, unknown>): string | undefined {
    return typeof item.group === 'string' && item.group !== '' ? item.group : undefined
}

function fromRow(item: unknown, labelKey: string, valueKey: string): SelectOption {
    if (typeof item !== 'object' || item === null) {
        return { value: item as string | number, label: String(item) }
    }

    const row = item as Record<string, unknown>
    const option: SelectOption = {
        value: (readProperty(row, valueKey) ?? String(item)) as string | number,
        label: String(readProperty(row, labelKey) ?? String(item)),
    }
    const group = groupOf(row)

    return group ? { ...option, group } : option
}

export function toOptions(
    options: OptionsInput | undefined | null,
    labelKey: string,
    valueKey: string,
    order?: Array<string | number>,
): SelectOption[] {
    if (!options) {
        return []
    }

    if (Array.isArray(options)) {
        return options.map((item) => fromRow(item, labelKey, valueKey))
    }

    const map = options as Record<string, unknown>
    const keys = Array.isArray(order) ? order.map(String).filter((key) => key in map) : Object.keys(map)
    const remaining = Object.keys(map).filter((key) => !keys.includes(key))

    return [...keys, ...remaining].map((value) => ({ value, label: String(map[value]) }))
}

export function groupOptions(options: SelectOption[]): OptionGroup[] {
    return options.reduce<OptionGroup[]>((groups, option) => {
        const label = option.group ?? null
        const last = groups[groups.length - 1]

        if (last && last.label === label) {
            last.options.push(option)

            return groups
        }

        groups.push({ label, options: [option] })

        return groups
    }, [])
}

export function hasGroups(options: SelectOption[]): boolean {
    return options.some((option) => option.group !== undefined)
}

export interface DependentOptions {
    field: string
    options: Record<string, Array<unknown>> | Array<Array<unknown>>
}

const NO_OPTIONS: Array<unknown> = []

function dependentKey(value: unknown): string {
    if (typeof value === 'boolean') {
        return value ? '1' : '0'
    }

    return value === null || value === undefined ? '' : String(value)
}

export function dependentOptionsFor(dependent: DependentOptions, value: unknown): Array<unknown> {
    const options = (dependent.options as Record<string, Array<unknown>>)[dependentKey(value)]

    return Array.isArray(options) ? options : NO_OPTIONS
}
