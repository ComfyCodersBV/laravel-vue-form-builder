import type { FormTheme } from '../lib/theme'
import type { DisabledDate } from '../lib/dates'
import type { FormColumns } from '../lib/layout'

export type FieldValue =
    | string
    | number
    | boolean
    | Array<string | number>
    | { start?: string | null; end?: string | null }
    | null

export interface FieldOption {
    value: string | number
    label: string
    help?: string
    description?: string
    disabled?: boolean
    href?: string
    linkLabel?: string
    target?: string
}

export interface LocaleOption {
    value: string
    label: string
}

export interface Field {
    name?: string
    type?: string
    label?: string
    condition?: string
    help?: string
    fullWidth?: boolean
    placeholder?: string
    readonly?: boolean
    disabled?: boolean
    className?: string
    theme?: Partial<FormTheme>
    modelValue?: FieldValue
    default?: FieldValue
    error?: string | string[]
    options?: Record<string, string> | Array<FieldOption> | Array<string | number>
    fields?: Field[]
    attrs?: Record<string, unknown>
    append?: string
    prepend?: string
    tooltip?: string
    format?: string
    locale?: string
    timezone?: string
    serverTimezone?: string
    title?: string
    description?: string
    currentUrl?: string
    currentName?: string
    preview?: boolean
    removeFlag?: string
    hideLabel?: boolean
    stored?: boolean
    currency?: string
    decimals?: number
    locales?: LocaleOption[]
    defaultLocale?: string
    requiredLocales?: string[]
    field?: Field
    display?: 'tabs' | 'stacked'
    disabledWeekdays?: number[]
    disabledDates?: DisabledDate[]
    columns?: FormColumns
    columnSpan?: number | 'full'
    linkTarget?: string
}

export type TForm = Record<string, FieldValue>

export interface FormSchema {
    schemaVersion?: string
    id?: string
    method: 'get' | 'post' | 'put' | 'patch' | 'delete' | 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    action: string
    formClass?: string | string[]
    defaults: TForm
    fields: Field[]
    theme?: Partial<FormTheme>
    format?: string
    locale?: string
    resetOnSuccess?: boolean
    submitOnChange?: boolean
}
