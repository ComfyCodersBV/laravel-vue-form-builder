<script setup lang="ts">
import { inject } from 'vue'
import { fieldSlotsKey } from '../lib/field-slots'
import type { Field } from '../types/form-builder'

import Button from './Fields/Button.vue'
import CheckboxField from './Fields/CheckboxField.vue'
import CheckboxesField from './Fields/CheckboxesField.vue'
import ColorField from './Fields/ColorField.vue'
import DateField from './Fields/DateField.vue'
import DeleteButtonField from './Fields/DeleteButtonField.vue'
import FileField from './Fields/FileField.vue'
import HiddenField from './Fields/HiddenField.vue'
import KeyValueField from './Fields/KeyValueField.vue'
import NumberField from './Fields/NumberField.vue'
import RadioGroupField from './Fields/RadioGroupField.vue'
import RecaptchaField from './Fields/RecaptchaField.vue'
import RepeaterField from './Fields/RepeaterField.vue'
import SelectField from './Fields/SelectField.vue'
import SubmitButton from './Fields/SubmitButton.vue'
import TextField from './Fields/TextField.vue'
import TextareaField from './Fields/TextareaField.vue'
import ToggleField from './Fields/ToggleField.vue'
import Wysiwyg from './Fields/Wysiwyg.vue'

const { field, form, onFieldChange, fieldOverrides } = defineProps<{
    field: Field
    form: any
    onFieldChange?: (field: string, value: any) => void
    fieldOverrides?: Record<string, Partial<Field & Record<string, any>>>
}>()

const fieldComponents: Record<string, any> = {
    button: Button,
    checkbox: CheckboxField,
    checkboxes: CheckboxesField,
    color: ColorField,
    date: DateField,
    delete: DeleteButtonField,
    email: TextField,
    file: FileField,
    hidden: HiddenField,
    keyvalue: KeyValueField,
    number: NumberField,
    password: TextField,
    radio: RadioGroupField,
    recaptcha: RecaptchaField,
    repeater: RepeaterField,
    select: SelectField,
    submit: SubmitButton,
    text: TextField,
    textarea: TextareaField,
    toggle: ToggleField,
    wysiwyg: Wysiwyg,
}

const fieldSlots = inject(fieldSlotsKey, {})

function componentFor() {
    return field.type ? fieldComponents[field.type] : undefined
}

function slotFor() {
    return (field.name ? fieldSlots[field.name] : undefined) ?? (field.type ? fieldSlots[field.type] : undefined)
}

function slotPropsFor() {
    const name = field.name ?? ''

    return {
        field,
        form,
        error: form.errors?.[name],
        modelValue: form[name],
        'onUpdate:modelValue': (value: any) => {
            form[name] = value
            onFieldChange?.(name, value)
        },
    }
}

function updateValue(value: any): void {
    const name = field.name ?? ''

    form[name] = value
    onFieldChange?.(name, value)
}
</script>

<template>
    <component
        v-if="slotFor()"
        :is="slotFor()"
        v-bind="slotPropsFor()"
    />
    <component
        v-else-if="componentFor()"
        :is="componentFor()"
        v-bind="{ ...field, ...(fieldOverrides?.[field.name ?? ''] ?? {}) }"
        :model-value="form[field.name!]"
        :error="form.errors[field.name!]"
        @update:modelValue="updateValue"
    />
    <div v-else class="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        Unknown field type: <code class="font-mono">{{ field.type }}</code>
    </div>
</template>
