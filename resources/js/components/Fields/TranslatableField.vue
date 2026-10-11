<script setup lang="ts">
import BaseField from './BaseField.vue'
import FormField from '../FormField.vue'
import type { Field, LocaleOption } from '../../types/form-builder'
import { computed, ref } from 'vue'
import { cn } from '../../lib/utils'
import { useFormMessages } from '../../lib/messages'

interface TranslatableFieldProps extends Field {
    form: any
}

const props = withDefaults(defineProps<TranslatableFieldProps>(), {
    className: undefined,
    defaultLocale: undefined,
    display: 'tabs',
    error: undefined,
    field: undefined,
    label: undefined,
    locales: () => [],
    modelValue: undefined,
    name: undefined,
    requiredLocales: () => [],
})

const emit = defineEmits<{ 'update:modelValue': [Record<string, any>] }>()

const messageContext = useFormMessages()

const active = ref<string>(props.defaultLocale ?? props.locales[0]?.value ?? '')

const values = computed<Record<string, any>>(() => {
    const value = props.modelValue as unknown

    return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {}
})

function nameFor(locale: string): string {
    return `${props.name ?? ''}.${locale}`
}

function hasError(locale: string): boolean {
    return Boolean(props.form?.errors?.[nameFor(locale)])
}

function isRequired(locale: string): boolean {
    return props.requiredLocales.includes(locale)
}

function fieldFor(locale: LocaleOption): Field {
    const stacked = props.display === 'stacked'

    return {
        ...(props.field ?? { type: 'text' }),
        name: nameFor(locale.value),
        label: stacked ? locale.label : `${props.label ?? props.name ?? ''} (${locale.label})`,
        hideLabel: !stacked,
    }
}

const forms = computed(() => Object.fromEntries(props.locales.map((locale) => [locale.value, formFor(locale.value)])))

function formFor(locale: string): Record<string, any> {
    const key = nameFor(locale)

    return new Proxy(props.form ?? {}, {
        get(target, property, receiver) {
            if (property === key) {
                return values.value[locale] ?? ''
            }

            if (typeof property === 'string' && property.startsWith('__v_')) {
                return undefined
            }

            return Reflect.get(target, property, receiver)
        },
        set(target, property, value, receiver) {
            if (property !== key) {
                return Reflect.set(target, property, value, receiver)
            }

            emit('update:modelValue', { ...values.value, [locale]: value })

            return true
        },
    })
}

function tabClass(locale: string): string {
    return cn(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm',
        active.value === locale ? 'bg-primary/15 font-medium text-primary shadow-sm' : 'text-muted-foreground hover:bg-muted',
    )
}
</script>

<template>
    <BaseField v-bind="{ label, name, error, className, help, theme }">
        <div v-if="display === 'stacked'" class="space-y-3" data-translatable>
            <FormField
                v-for="locale in locales"
                :key="locale.value"
                :field="fieldFor(locale)"
                :form="forms[locale.value]"
            />
        </div>

        <div v-else class="space-y-2" data-translatable>
            <div class="flex flex-wrap items-center gap-1 border-b pb-1" role="tablist" :aria-label="label">
                <button
                    v-for="locale in locales"
                    :key="locale.value"
                    type="button"
                    role="tab"
                    :id="`${name}-tab-${locale.value}`"
                    :aria-selected="active === locale.value"
                    :aria-controls="`${name}-panel-${locale.value}`"
                    :class="tabClass(locale.value)"
                    :data-locale="locale.value"
                    @click="active = locale.value"
                >
                    {{ locale.label }}<span v-if="isRequired(locale.value)" aria-hidden="true">*</span>
                    <span
                        v-if="hasError(locale.value)"
                        class="size-1.5 rounded-full bg-red-600"
                        role="img"
                        :aria-label="messageContext.messages.containsErrors"
                        data-locale-error
                    />
                </button>
            </div>

            <div
                v-for="locale in locales"
                v-show="active === locale.value"
                :key="locale.value"
                role="tabpanel"
                :id="`${name}-panel-${locale.value}`"
                :aria-labelledby="`${name}-tab-${locale.value}`"
            >
                <FormField
                    :field="fieldFor(locale)"
                    :form="forms[locale.value]"
                />
            </div>
        </div>
    </BaseField>
</template>
