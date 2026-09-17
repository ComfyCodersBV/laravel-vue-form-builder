<script setup lang="ts">
import { useForm } from '@inertiajs/vue3'
import { computed, provide, useSlots } from 'vue'
import FormRenderer from './FormRenderer.vue'
import { fieldSlotsKey } from '../lib/field-slots'
import { assertSupportedSchemaVersion } from '../lib/schema-version'
import { DEFAULT_THEME, mergeTheme, themeKey } from '../lib/theme'
import { layoutKey, type FormLayout } from '../lib/layout'
import { FormSchema } from '../types/form-builder'
import { useHttpForm, type HttpFormErrorAdapter, type HttpFormSubmitter } from '../composables/useHttpForm'

const {
    schema,
    options,
    onFieldChange,
    fieldOverrides,
    transport = 'inertia',
    submitter,
    errorAdapter,
    layout = 'stacked',
    columns = 1,
} = defineProps<{
    schema: FormSchema
    options?: Record<string, any>
    onFieldChange?: (field: string, value: any, form: any) => void
    fieldOverrides?: Record<string, Partial<Record<string, any>>>
    transport?: 'inertia' | 'http'
    submitter?: HttpFormSubmitter
    errorAdapter?: HttpFormErrorAdapter
    layout?: FormLayout
    columns?: 1 | 2
}>()

const emit = defineEmits<{ (e: 'success'): void; (e: 'error'): void }>()

assertSupportedSchemaVersion(schema.schemaVersion)

provide(themeKey, computed(() => mergeTheme(DEFAULT_THEME, schema.theme)))
provide(fieldSlotsKey, useSlots())
provide(layoutKey, computed((): FormLayout => layout))

const raw = (schema as any).defaults ?? {}
const formData: Record<string, any> = Array.isArray(raw) ? {} : { ...raw }

const BOOLEAN_FIELD_TYPES = ['checkbox', 'toggle']

const isBlank = (value: any) => value === null || typeof value === 'undefined' || value === ''

schema.fields.forEach((field: any) => {
    if (!field?.name) {
        return
    }

    if (field.type === 'file') {
        formData[field.name] = field.multiple === true ? [] : ''
        return
    }

    const hasExplicit = Object.prototype.hasOwnProperty.call(formData, field.name)
    const fieldHasDefault = typeof field.default !== 'undefined' && field.default !== null && field.default !== ''

    // A checkbox nobody touches has to submit the same value as one that is
    // ticked off, because an empty string reaches Laravel as null and the
    // column behind a checkbox rarely takes one. An explicit false stays false.
    if (BOOLEAN_FIELD_TYPES.includes(field.type)) {
        if (isBlank(hasExplicit ? formData[field.name] : undefined)) {
            formData[field.name] = fieldHasDefault ? field.default : (field.falseValue ?? '0')
        }

        return
    }

    if (!hasExplicit) {
        if (fieldHasDefault) {
            formData[field.name] = field.default
        } else if (field.multiple === true) {
            formData[field.name] = []
        } else {
            formData[field.name] = ''
        }
    }
})

const form = transport === 'http'
    ? useHttpForm(formData, { submitter, errorAdapter })
    : useForm(formData)

const submitForm = () => {
    const method = (schema.method ?? 'post').toLowerCase()
    const opts = { onSuccess: () => emit('success'), onError: () => emit('error'), ...(options ?? {}) }

    if (method === 'get') {
        return (form as any).get(schema.action, opts)
    }

    if (['post', 'put', 'patch', 'delete'].includes(method)) {
        return (form as any)[method].call(form, schema.action, opts)
    }

    return (form as any).post(schema.action, opts)
}

defineExpose({submit: submitForm, form})
</script>

<template>
    <form
        :id="schema.id"
        :class="schema.formClass || ''"
        @submit.prevent="submitForm"
    >
        <FormRenderer
            :columns="columns"
            :fields="schema.fields"
            :form="form"
            :on-field-change="onFieldChange ? (field, value) => onFieldChange(field, value, form) : undefined"
            :field-overrides="fieldOverrides"
        />
    </form>
</template>
