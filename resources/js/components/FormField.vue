<script setup lang="ts">
import { computed, inject, provide } from 'vue'
import { useFormMessages } from '../lib/messages'
import { fieldSlotsKey } from '../lib/field-slots'
import { hideLabelKey } from '../lib/label'
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
import MoneyField from './Fields/MoneyField.vue'
import NumberField from './Fields/NumberField.vue'
import RadioGroupField from './Fields/RadioGroupField.vue'
import RecaptchaField from './Fields/RecaptchaField.vue'
import RepeaterField from './Fields/RepeaterField.vue'
import SectionField from './Fields/SectionField.vue'
import SelectField from './Fields/SelectField.vue'
import SubmitButton from './Fields/SubmitButton.vue'
import TagsField from './Fields/TagsField.vue'
import TextField from './Fields/TextField.vue'
import TextareaField from './Fields/TextareaField.vue'
import TimeField from './Fields/TimeField.vue'
import ToggleField from './Fields/ToggleField.vue'
import TranslatableField from './Fields/TranslatableField.vue'
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
    money: MoneyField,
    number: NumberField,
    password: TextField,
    radio: RadioGroupField,
    radios: RadioGroupField,
    recaptcha: RecaptchaField,
    repeater: RepeaterField,
    select: SelectField,
    submit: SubmitButton,
    tags: TagsField,
    text: TextField,
    textarea: TextareaField,
    time: TimeField,
    toggle: ToggleField,
    translatable: TranslatableField,
    wysiwyg: Wysiwyg,
}

const fieldSlots = inject(fieldSlotsKey, {})

provide(hideLabelKey, computed(() => field.hideLabel === true))

const messageContext = useFormMessages()

function extraProps(): Record<string, any> {
    if (field.type === 'translatable') {
        return { form }
    }

    if (field.type === 'tags') {
        return { entryErrors: entryErrorsFor(field.name ?? '') }
    }

    if (!field.removeFlag) {
        return {}
    }

    return { removeRequested: form[field.removeFlag] }
}

function entryErrorsFor(name: string): Record<string, string | string[]> {
    const prefix = `${name}.`

    return Object.fromEntries(
        Object.entries(form.errors ?? {})
            .filter(([key]) => key.startsWith(prefix))
            .map(([key, message]) => [key.slice(prefix.length), message as string | string[]]),
    )
}

function updateFormValue(name: string, value: any): void {
    form[name] = value
    onFieldChange?.(name, value)
}

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
    <SectionField
        v-else-if="field.type === 'section'"
        :field="field"
        :form="form"
        :on-field-change="onFieldChange"
        :field-overrides="fieldOverrides"
    />
    <component
        v-else-if="componentFor()"
        :is="componentFor()"
        v-bind="{ ...field, ...extraProps(), ...(fieldOverrides?.[field.name ?? ''] ?? {}) }"
        :model-value="form[field.name!]"
        :error="form.errors[field.name!]"
        @update:modelValue="updateValue"
        @update:formValue="updateFormValue"
    />
    <div v-else class="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        {{ messageContext.messages.unknownFieldType }} <code class="font-mono">{{ field.type }}</code>
    </div>
</template>
