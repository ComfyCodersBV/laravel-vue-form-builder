export interface Field {
    attrs?: Record<string, unknown>
    className?: string
    disabled?: boolean
    error?: string | string[]
    label?: string
    help?: string
    modelValue?: string | number | boolean | Array<string | number> | { start?: string | null; end?: string | null }
    name?: string
    placeholder?: string
    readonly ?: boolean
    type?: string
    default?: unknown
    options?: Record<string, string> | Array<{ value: string | number; label: string }> | Array<string | number>
}

export interface FormSchema {
    id?: string
    method: string
    action: string
    defaults: Record<string, unknown>
    fields: Field[]
    format?: string
    locale?: string
}
