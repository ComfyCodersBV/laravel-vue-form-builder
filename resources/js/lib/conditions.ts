import type { Field } from '../types/form-builder'
import { flattenFields } from './fields'

const BOOLEAN_FIELD_TYPES = ['checkbox', 'toggle']

function isOn(value: any, onValue: any): boolean {
    if (value === true || value === false) {
        return value
    }

    if (value === undefined || value === null) {
        return false
    }

    return String(value) === String(onValue ?? '1')
}

export function formValues(form: any): Record<string, any> {
    return typeof form?.data === 'function' ? form.data() : { ...form }
}

export function conditionData(data: Record<string, any>, fields: Field[]): Record<string, any> {
    const normalized = { ...data }

    flattenFields(fields).forEach((field: any) => {
        if (!field?.name || !BOOLEAN_FIELD_TYPES.includes(field.type) || !(field.name in normalized)) {
            return
        }

        normalized[field.name] = isOn(normalized[field.name], field.value)
    })

    return normalized
}

export function meetsCondition(field: Field, data: Record<string, any>): boolean {
    if (!field.condition) {
        return true
    }

    try {
        const keys = Object.keys(data)
        const values = keys.map((key) => data[key])
        const evaluate = new Function('form', ...keys, `return !!(${field.condition})`)

        return evaluate(data, ...values)
    } catch {
        return true
    }
}

export function visibleValueFields(fields: Field[], data: Record<string, any>): Field[] {
    return fields
        .filter((field) => meetsCondition(field, data))
        .flatMap((field) => {
            if (field.type === 'section' || field.type === 'step') {
                return visibleValueFields(field.fields ?? [], data)
            }

            return field.name ? [field] : []
        })
}
