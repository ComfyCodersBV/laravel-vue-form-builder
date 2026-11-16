import type { Field, FieldVisibility } from '../types/form-builder'
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

const submittedValues = new WeakMap<Record<string, any>, Record<string, any>>()

export function conditionData(data: Record<string, any>, fields: Field[]): Record<string, any> {
    const normalized = { ...data }

    submittedValues.set(normalized, data)

    flattenFields(fields).forEach((field: any) => {
        if (!field?.name || !BOOLEAN_FIELD_TYPES.includes(field.type) || !(field.name in normalized)) {
            return
        }

        normalized[field.name] = isOn(normalized[field.name], field.value)
    })

    return normalized
}

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/

const UNSAFE_SEGMENTS = ['__proto__', 'constructor', 'prototype']

const RESERVED_WORDS = new Set([
    'arguments', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete',
    'do', 'else', 'enum', 'eval', 'export', 'extends', 'false', 'finally', 'for', 'function', 'if', 'implements',
    'import', 'in', 'instanceof', 'interface', 'let', 'new', 'null', 'package', 'private', 'protected', 'public',
    'return', 'static', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 'void', 'while', 'with',
    'yield',
])

function isPlainObject(value: unknown): value is Record<string, any> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function expressionScope(data: Record<string, any>): Record<string, any> {
    const scope: Record<string, any> = { ...data }
    const owned = new Set<Record<string, any>>()

    Object.keys(data)
        .filter((key) => key.includes('.'))
        .forEach((key) => {
            const path = key.split('.')

            if (path.some((segment) => UNSAFE_SEGMENTS.includes(segment))) {
                return
            }

            let target = scope

            for (const segment of path.slice(0, -1)) {
                const current = target[segment]

                if (current !== undefined && !isPlainObject(current)) {
                    return
                }

                if (current === undefined || !owned.has(current)) {
                    target[segment] = { ...(current ?? {}) }
                    owned.add(target[segment])
                }

                target = target[segment]
            }

            const last = path[path.length - 1]

            if (!Object.hasOwn(target, last)) {
                target[last] = data[key]
            }
        })

    return scope
}

function evaluate(expression: string, data: Record<string, any>): unknown {
    const scope = expressionScope(data)
    const keys = Object.keys(scope).filter((key) => key !== 'form' && IDENTIFIER.test(key) && !RESERVED_WORDS.has(key))
    const values = keys.map((key) => scope[key])
    const run = new Function('form', ...keys, `return (${expression})`)

    return run(scope, ...values)
}

function reportFailure(expression: string, error: unknown): void {
    if (import.meta.env.DEV) {
        console.warn(`[form-builder] The expression \`${expression}\` failed and counts as false:`, error)
    }
}

function valueAt(data: Record<string, any>, path: string): unknown {
    if (Object.hasOwn(data, path)) {
        return data[path]
    }

    return path.split('.').reduce<unknown>((current, segment) => {
        if (UNSAFE_SEGMENTS.includes(segment) || typeof current !== 'object' || current === null) {
            return undefined
        }

        return (current as Record<string, unknown>)[segment]
    }, data)
}

function comparableValue(value: unknown): string | undefined {
    if (value === undefined || value === null || value === '') {
        return 'null'
    }

    if (typeof value === 'object') {
        return undefined
    }

    return String(value)
}

function holds(condition: { field: string; values: string[] }, values: Record<string, any>): boolean {
    const value = comparableValue(valueAt(values, condition.field))

    return value !== undefined && (condition.values ?? []).map(String).includes(value)
}

export function meetsVisibility(when: FieldVisibility, data: Record<string, any>): boolean {
    const values = submittedValues.get(data) ?? data

    return [when, ...(when.also ?? [])].every((condition) => holds(condition, values))
}

export function meetsCondition(field: Field, data: Record<string, any>): boolean {
    if (field.when) {
        return meetsVisibility(field.when, data)
    }

    if (!field.condition) {
        return true
    }

    try {
        return !!evaluate(field.condition, data)
    } catch (error) {
        reportFailure(field.condition, error)

        return false
    }
}

export function expressionValue(expression: string, data: Record<string, any>): string {
    try {
        const value = evaluate(expression, data)

        if (value === null || value === undefined || value === false || (typeof value === 'number' && Number.isNaN(value))) {
            return ''
        }

        return String(value)
    } catch (error) {
        reportFailure(expression, error)

        return ''
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

function visibleRow(fields: Field[], row: unknown): unknown {
    if (typeof row !== 'object' || row === null || Array.isArray(row)) {
        return row
    }

    return withoutHiddenValues(fields, row as Record<string, any>)
}

function hiddenNames(field: Field): string[] {
    if (field.type === 'section' || field.type === 'step') {
        return flattenFields(field.fields ?? []).flatMap(hiddenNames)
    }

    return [field.name, field.removeFlag].filter((name): name is string => typeof name === 'string' && name !== '')
}

export function withoutHiddenValues(fields: Field[], data: Record<string, any>): Record<string, any> {
    const values = { ...data }

    const visit = (field: Field): void => {
        if (field.when && !meetsVisibility(field.when, data)) {
            hiddenNames(field).forEach((name) => delete values[name])

            return
        }

        if (field.type === 'section' || field.type === 'step') {
            (field.fields ?? []).forEach(visit)

            return
        }

        if (field.type === 'repeater' && field.name && Array.isArray(values[field.name])) {
            values[field.name] = values[field.name].map((row: unknown) => visibleRow(field.fields ?? [], row))
        }
    }

    fields.forEach(visit)

    return values
}
