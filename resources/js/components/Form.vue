<script setup lang="ts">
import { useForm } from '@inertiajs/vue3'
import { computed, provide, useSlots, watch } from 'vue'
import FormRenderer from './FormRenderer.vue'
import { fieldSlotsKey } from '../lib/field-slots'
import { flattenFields, formFieldsKey } from '../lib/fields'
import { messagesKey, resolveLocale, resolveMessages, type FormMessages } from '../lib/messages'
import { assertSupportedSchemaVersion } from '../lib/schema-version'
import { DEFAULT_THEME, mergeTheme, themeKey } from '../lib/theme'
import { columnsKey, layoutKey, type FormLayout } from '../lib/layout'
import { FormSchema } from '../types/form-builder'
import { carriesFiles, useHttpForm, type HttpFormErrorAdapter, type HttpFormSubmitter } from '../composables/useHttpForm'

type FormMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

const props = defineProps<{
    schema: FormSchema
    options?: Record<string, any>
    onFieldChange?: (field: string, value: any, form: any) => void
    fieldOverrides?: Record<string, Partial<Record<string, any>>>
    transport?: 'inertia' | 'http'
    submitter?: HttpFormSubmitter
    errorAdapter?: HttpFormErrorAdapter
    layout?: FormLayout
    columns?: 1 | 2
    action?: string
    method?: FormMethod
    defaults?: Record<string, any>
    locale?: string
    messages?: Partial<FormMessages>
}>()

const emit = defineEmits<{ (e: 'success'): void; (e: 'error'): void }>()

assertSupportedSchemaVersion(props.schema.schemaVersion)

const fields = flattenFields(props.schema.fields)

provide(themeKey, computed(() => mergeTheme(DEFAULT_THEME, props.schema.theme)))
provide(fieldSlotsKey, useSlots())
provide(layoutKey, computed((): FormLayout => props.layout ?? 'stacked'))
provide(columnsKey, computed((): 1 | 2 => props.columns ?? 1))
provide(formFieldsKey, fields)
provide(messagesKey, computed(() => {
    const locale = resolveLocale(props.locale, props.schema.locale)

    return {
        locale,
        messages: resolveMessages(locale, props.messages),
    }
}))

const BOOLEAN_FIELD_TYPES = ['checkbox', 'toggle']

const SPOOFED_METHODS = ['put', 'patch', 'delete']

const isBlank = (value: any) => value === null || typeof value === 'undefined' || value === ''

function schemaDefaults(): Record<string, any> {
    const raw = (props.schema as any).defaults ?? {}

    return Array.isArray(raw) ? {} : { ...raw }
}

function initialValue(field: any, formData: Record<string, any>): any {
    const hasExplicit = Object.prototype.hasOwnProperty.call(formData, field.name)
    const fieldHasDefault = typeof field.default !== 'undefined' && field.default !== null && field.default !== ''

    if (BOOLEAN_FIELD_TYPES.includes(field.type)) {
        if (!isBlank(hasExplicit ? formData[field.name] : undefined)) {
            return formData[field.name]
        }

        return fieldHasDefault ? field.default : (field.falseValue ?? '0')
    }

    if (hasExplicit) {
        return formData[field.name]
    }

    if (fieldHasDefault) {
        return field.default
    }

    return field.multiple === true ? [] : ''
}

function buildFormData(overrides: Record<string, any> = {}): Record<string, any> {
    const formData: Record<string, any> = { ...schemaDefaults(), ...overrides }

    fields.forEach((field: any) => {
        if (!field?.name) {
            return
        }

        if (field.type !== 'file') {
            formData[field.name] = initialValue(field, formData)

            return
        }

        formData[field.name] = field.multiple === true ? [] : ''

        if (field.removeFlag) {
            formData[field.removeFlag] = false
        }
    })

    return formData
}

const form: any = props.transport === 'http'
    ? useHttpForm(buildFormData(props.defaults), { submitter: props.submitter, errorAdapter: props.errorAdapter })
    : useForm(buildFormData(props.defaults))

watch(() => JSON.stringify(props.defaults ?? {}), () => {
    const data = buildFormData(props.defaults)

    Object.entries(data).forEach(([key, value]) => {
        form[key] = value
    })

    if (typeof form.defaults === 'function') {
        form.defaults(data)
    }

    form.clearErrors?.()
})

let spoofing = false

function resolvedMethod(): FormMethod {
    const method = (props.method ?? props.schema.method ?? 'post').toLowerCase()

    return ['get', 'post', 'put', 'patch', 'delete'].includes(method) ? method as FormMethod : 'post'
}

function submitInertia(method: FormMethod, action: string, options: Record<string, any>) {
    if (SPOOFED_METHODS.includes(method) && carriesFiles(form.data())) {
        spoofing = true
        form.transform((data: Record<string, any>) => ({ ...data, _method: method }))

        return form.post(action, options)
    }

    if (spoofing) {
        spoofing = false
        form.transform((data: Record<string, any>) => data)
    }

    return form[method](action, options)
}

const submitForm = () => {
    const method = resolvedMethod()
    const action = props.action ?? props.schema.action
    const options = { onSuccess: () => emit('success'), onError: () => emit('error'), ...(props.options ?? {}) }

    if (props.transport === 'http') {
        return form[method](action, options)
    }

    return submitInertia(method, action, options)
}

defineExpose({ submit: submitForm, form })
</script>

<template>
    <form
        :id="schema.id"
        :class="schema.formClass || ''"
        @submit.prevent="submitForm"
    >
        <FormRenderer
            :columns="columns ?? 1"
            :fields="schema.fields"
            :form="form"
            :on-field-change="onFieldChange ? (field, value) => onFieldChange!(field, value, form) : undefined"
            :field-overrides="fieldOverrides"
        />
    </form>
</template>
