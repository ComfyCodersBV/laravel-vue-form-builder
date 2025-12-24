<script setup lang="ts">
import { reactive } from 'vue'
import { Field } from '../types/form-builder'
import { toBoolean } from '../lib/utils'

import Button from './Fields/Button.vue'
import CheckboxField from './Fields/CheckboxField.vue'
import CheckboxesField from './Fields/CheckboxesField.vue'
import DateField from './Fields/DateField.vue'
import HiddenField from './Fields/HiddenField.vue'
import NumberField from './Fields/NumberField.vue'
import RadioGroupField from './Fields/RadioGroupField.vue'
import SelectField from './Fields/SelectField.vue'
import SubmitButton from './Fields/SubmitButton.vue'
import TextField from './Fields/TextField.vue'
import TextareaField from './Fields/TextareaField.vue'
import ToggleField from './Fields/ToggleField.vue'
import FileField from './Fields/FileField.vue';
import KeyValueField from './Fields/KeyValueField.vue'

const { fields, values, errors } = defineProps<{
    fields: Field[]
    values: Record<string, any>
    errors?: Record<string, string | string[]>
}>()

const localValues = reactive({ ...values })

function updateValue(field: Field, value: unknown) {
    if (! field.name) {
        return
    }

    localValues[field.name!] = value
    values[field.name!] = value
}

function onModelValue(field: Field) {
    return (val: any) => updateValue(field, val)
}

function valueFor(field: Field) {
    if (! field.name) {
        return undefined
    }

    const value = (localValues as any)[field.name]
    if (field.type === 'checkbox' || field.type === 'toggle') {
        const isEmpty = value === undefined || value === null || (typeof value === 'string' && value.length === 0)
        const defaultValue = (field as any)?.default
        return isEmpty ? toBoolean(defaultValue) : toBoolean(value)
    }

    if (field.type === 'checkboxes') {
        const arr = value
        if (Array.isArray(arr)) {
            return arr
        }

        const def = (field as any)?.default
        return Array.isArray(def) ? def : []
    }

    if (field.type === 'select' && (field as any)?.multiple) {
        const arr = value
        if (Array.isArray(arr)) {
            return arr
        }

        const def = (field as any)?.default
        return Array.isArray(def) ? def : []
    }

    if (field.type === 'date') {
        if ((field as any)?.range) {
            const v = value
            if (v && typeof v === 'object') {
                return v
            }

            const def = (field as any)?.default
            return def && typeof def === 'object' ? def : { start: null, end: null }
        }

        const v = value
        if (typeof v === 'string' && v.length) {
            return v
        }

        const def = (field as any)?.default
        return typeof def === 'string' ? def : ''
    }

    return value
}

function errorFor(field: Field) {
    if (! field.name) {
        return undefined
    }

    return (errors as any)?.[field.name]
}

const fieldComponents: Record<string, any> = {
    button: Button,
    checkbox: CheckboxField,
    checkboxes: CheckboxesField,
    color: TextField,
    date: DateField,
    email: TextField,
    file: FileField,
    hidden: HiddenField,
    keyvalue: KeyValueField,
    number: NumberField,
    password: TextField,
    radio: RadioGroupField,
    select: SelectField,
    submit: SubmitButton,
    text: TextField,
    textarea: TextareaField,
    toggle: ToggleField,
}

function componentFor(field: Field) {
    return field.type ? fieldComponents[field.type] : undefined
}
</script>

<template>
    <div class="space-y-4">
        <template v-for="(field, i) in fields" :key="field.name ?? i">
            <component
                v-if="componentFor(field)"
                :is="componentFor(field)"
                v-bind="field"
                :model-value="valueFor(field)"
                @update:model-value="onModelValue(field)"
                :error="errorFor(field)"
            />
            <div
                v-else
                class="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
                Unknown field type: <code class="font-mono">{{ field.type }}</code>
            </div>
        </template>
    </div>
</template>
