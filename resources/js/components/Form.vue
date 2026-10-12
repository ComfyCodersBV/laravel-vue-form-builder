<script setup lang="ts">
import { useForm } from '@inertiajs/vue3'
import { computed, onBeforeUnmount, provide, useSlots, watch } from 'vue'
import FormRenderer from './FormRenderer.vue'
import { fieldSlotsKey } from '../lib/field-slots'
import { flattenFields, formFieldsKey } from '../lib/fields'
import { messagesKey, resolveLocale, resolveMessages, type FormMessages } from '../lib/messages'
import { assertSupportedSchemaVersion } from '../lib/schema-version'
import { DEFAULT_THEME, mergeTheme, themeKey } from '../lib/theme'
import { columnsKey, layoutKey, normalizeColumns, type FormColumns, type FormLayout } from '../lib/layout'
import type { Field, FormSchema } from '../types/form-builder'
import { carriesFiles, useHttpForm, type HttpFormErrorAdapter, type HttpFormSubmitter } from '../composables/useHttpForm'

type FormMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

const props = withDefaults(defineProps<{
    schema: FormSchema
    options?: Record<string, any>
    onFieldChange?: (field: string, value: any, form: any) => void
    fieldOverrides?: Record<string, Partial<Record<string, any>>>
    transport?: 'inertia' | 'http'
    submitter?: HttpFormSubmitter
    errorAdapter?: HttpFormErrorAdapter
    layout?: FormLayout
    columns?: FormColumns
    action?: string
    method?: FormMethod
    defaults?: Record<string, any>
    locale?: string
    messages?: Partial<FormMessages>
    resetOnSuccess?: boolean
    submitOnChange?: boolean
    submitDelay?: number
}>(), {
    resetOnSuccess: undefined,
    submitOnChange: undefined,
})

const emit = defineEmits<{ (e: 'success'): void; (e: 'error'): void }>()

assertSupportedSchemaVersion(props.schema.schemaVersion)

const fields = flattenFields(props.schema.fields)

provide(themeKey, computed(() => mergeTheme(DEFAULT_THEME, props.schema.theme)))
provide(fieldSlotsKey, useSlots())
provide(layoutKey, computed((): FormLayout => props.layout ?? 'stacked'))
provide(columnsKey, computed((): FormColumns => normalizeColumns(props.columns ?? props.schema.columns ?? 1)))
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

const DEFAULT_SUBMIT_DELAY = 300

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

    if (field.type === 'translatable') {
        return translatableValue(field, hasExplicit ? formData[field.name] : field.default)
    }

    if (hasExplicit) {
        return formData[field.name]
    }

    if (fieldHasDefault) {
        return field.default
    }

    return field.multiple === true ? [] : ''
}

function translatableValue(field: Field, value: any): Record<string, any> {
    const locales = (field.locales ?? []).map((locale) => locale.value)

    if (typeof value === 'string' && value !== '') {
        return Object.fromEntries(locales.map((locale) => [locale, locale === (field.defaultLocale ?? locales[0]) ? value : '']))
    }

    const given = value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {}

    return Object.fromEntries(locales.map((locale) => [locale, given[locale] ?? '']))
}

function emptyFileValue(field: Field & { multiple?: boolean }): any {
    return field.multiple === true ? [] : ''
}

function buildFormData(overrides: Record<string, any> = {}): Record<string, any> {
    const formData: Record<string, any> = { ...schemaDefaults(), ...overrides }

    fields.forEach((field: any) => {
        if (!field?.name) {
            return
        }

        formData[field.name] = field.type === 'file' ? emptyFileValue(field) : initialValue(field, formData)

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

function resolvedMethod(): FormMethod {
    const method = (props.method ?? props.schema.method ?? 'post').toLowerCase()

    return ['get', 'post', 'put', 'patch', 'delete'].includes(method) ? method as FormMethod : 'post'
}

function isBlankQueryValue(value: any): boolean {
    return isBlank(value) || (Array.isArray(value) && value.length === 0)
}

function withoutBlanks(data: Record<string, any>): Record<string, any> {
    return Object.fromEntries(Object.entries(data).filter(([, value]) => !isBlankQueryValue(value)))
}

function currentPath(): string {
    return typeof window === 'undefined' ? '' : window.location.pathname
}

function submitInertia(method: FormMethod, action: string, options: Record<string, any>) {
    if (method === 'get') {
        form.transform(withoutBlanks)

        return form.get(action || currentPath(), { preserveState: true, preserveScroll: true, ...options })
    }

    if (SPOOFED_METHODS.includes(method) && carriesFiles(form.data())) {
        form.transform((data: Record<string, any>) => ({ ...data, _method: method }))

        return form.post(action, options)
    }

    form.transform((data: Record<string, any>) => data)

    return form[method](action, options)
}

const shouldResetOnSuccess = computed(() => props.resetOnSuccess ?? props.schema.resetOnSuccess === true)

function clearFiles(): void {
    fields.forEach((field: any) => {
        if (field?.name && field.type === 'file') {
            form[field.name] = emptyFileValue(field)
        }

        if (field?.removeFlag) {
            form[field.removeFlag] = false
        }
    })
}

function afterSuccess(): void {
    if (shouldResetOnSuccess.value) {
        form.reset?.()
        form.clearErrors?.()
    }

    clearFiles()
}

function successHandler(options: Record<string, any> | undefined): (...args: any[]) => void {
    return (...args: any[]) => {
        afterSuccess()

        if (typeof options?.onSuccess === 'function') {
            options.onSuccess(...args)

            return
        }

        emit('success')
    }
}

const submitForm = () => {
    const method = resolvedMethod()
    const action = props.action ?? props.schema.action
    const options = {
        onError: () => emit('error'),
        ...(props.options ?? {}),
        onSuccess: successHandler(props.options),
    }

    if (props.transport === 'http') {
        return form[method](action, options)
    }

    return submitInertia(method, action, options)
}

const shouldSubmitOnChange = computed(() => props.submitOnChange ?? props.schema.submitOnChange === true)

let pendingSubmit: ReturnType<typeof setTimeout> | undefined

function scheduleSubmit(): void {
    clearTimeout(pendingSubmit)

    pendingSubmit = setTimeout(submitForm, props.submitDelay ?? DEFAULT_SUBMIT_DELAY)
}

onBeforeUnmount(() => clearTimeout(pendingSubmit))

function handleFieldChange(field: string, value: any): void {
    props.onFieldChange?.(field, value, form)

    if (shouldSubmitOnChange.value) {
        scheduleSubmit()
    }
}

const fieldNames = computed(() => fields.flatMap((field: any) => [field?.name, field?.removeFlag].filter(Boolean) as string[]))

function belongsToField(key: string): boolean {
    return fieldNames.value.some((name) => key === name || key.startsWith(`${name}.`) || key.startsWith(`${name}[`))
}

const formErrors = computed<Record<string, string>>(() => {
    const errors: Record<string, any> = form.errors ?? {}

    return Object.fromEntries(
        Object.entries(errors)
            .filter(([key, message]) => !belongsToField(key) && !isBlank(message))
            .map(([key, message]) => [key, Array.isArray(message) ? String(message[0]) : String(message)]),
    )
})

const hasFormErrors = computed(() => Object.keys(formErrors.value).length > 0)

const slots = useSlots()

defineExpose({ submit: submitForm, form, formErrors })
</script>

<template>
    <form
        :id="schema.id"
        :class="schema.formClass || ''"
        @submit.prevent="submitForm"
    >
        <template v-if="hasFormErrors">
            <slot v-if="slots['form-errors']" name="form-errors" :errors="formErrors" />
            <div
                v-else
                role="alert"
                class="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
                data-form-errors
            >
                <p v-for="(message, key) in formErrors" :key="key">{{ message }}</p>
            </div>
        </template>

        <FormRenderer
            :columns="columns ?? schema.columns ?? 1"
            :fields="schema.fields"
            :form="form"
            :on-field-change="onFieldChange || shouldSubmitOnChange ? handleFieldChange : undefined"
            :field-overrides="fieldOverrides"
        />
    </form>
</template>
