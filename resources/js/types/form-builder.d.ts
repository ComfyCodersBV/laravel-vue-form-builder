export type FieldValue =
    | string
    | number
    | boolean
    | Array<string | number>
    | { start?: string | null; end?: string | null }
    | null

export interface Field {
    name?: string
    type?: string
    label?: string
    help?: string
    placeholder?: string
    readonly?: boolean
    disabled?: boolean
    className?: string
    modelValue?: FieldValue
    default?: FieldValue
    error?: string | string[]
    options?: Record<string, string> | Array<{ value: string | number; label: string }> | Array<string | number>
    attrs?: Record<string, unknown>
    append?: string
    prepend?: string
    tooltip?: string
}

export type TForm = Record<string, FieldValue>

export interface FormSchema {
    id?: string
    method: 'get' | 'post' | 'put' | 'patch' | 'delete'
    action: string
    defaults: TForm
    fields: Field[]
    format?: string
    locale?: string
}
