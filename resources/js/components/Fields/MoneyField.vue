<script setup lang="ts">
import BaseField from './BaseField.vue'
import { Input } from '../ui/input'
import type { Field } from '../../types/form-builder'
import { computed, ref, watch } from 'vue'
import { cn } from '../../lib/utils'
import { useFormMessages } from '../../lib/messages'
import { formatMinorUnits, moneyFormat, parseMinorUnits } from '../../lib/money'

interface MoneyFieldProps extends Field {
    currency?: string
    decimals?: number
    min?: number
    max?: number
}

const props = withDefaults(defineProps<MoneyFieldProps>(), {
    className: undefined,
    currency: 'EUR',
    decimals: 2,
    disabled: false,
    error: undefined,
    label: undefined,
    locale: undefined,
    max: undefined,
    min: undefined,
    modelValue: null,
    name: undefined,
    placeholder: undefined,
    readonly: false,
})

const emit = defineEmits<{ 'update:modelValue': [number | string | null] }>()

const messageContext = useFormMessages()

const resolvedLocale = computed(() => props.locale ?? messageContext.value.locale)

const format = computed(() => moneyFormat(resolvedLocale.value, props.currency))

const allowsNegative = computed(() => typeof props.min !== 'number' || props.min < 0)

const text = ref('')
const invalid = ref(false)
let lastEmitted: unknown = Symbol('none')

function display(value: unknown): string {
    if (typeof value === 'number') {
        return formatMinorUnits(value, props.decimals, resolvedLocale.value)
    }

    if (typeof value === 'string' && /^-?\d+$/.test(value)) {
        return formatMinorUnits(Number(value), props.decimals, resolvedLocale.value)
    }

    return typeof value === 'string' ? value : ''
}

watch(
    () => [props.modelValue, resolvedLocale.value, props.decimals],
    () => {
        if (props.modelValue === lastEmitted) {
            return
        }

        text.value = display(props.modelValue)
        invalid.value = false
    },
    { immediate: true },
)

function commit(value: number | string | null) {
    lastEmitted = value
    emit('update:modelValue', value)
}

function onInput(value: string | number) {
    text.value = String(value)

    const parsed = parseMinorUnits(text.value, props.decimals, resolvedLocale.value, props.currency)

    invalid.value = !parsed.valid

    commit(parsed.valid ? parsed.value : text.value)
}

function onBlur() {
    const parsed = parseMinorUnits(text.value, props.decimals, resolvedLocale.value, props.currency)

    if (parsed.valid) {
        text.value = display(parsed.value)
    }
}

function onBeforeInput(event: InputEvent) {
    if (!event.data) {
        return
    }

    const allowed = allowsNegative.value ? /^[\d.,\s '’-]+$/ : /^[\d.,\s '’]+$/

    if (!allowed.test(event.data)) {
        event.preventDefault()
    }
}
</script>

<template>
    <BaseField v-bind="{ label, name, error, className, help, theme }">
        <div class="flex w-full">
            <span
                v-if="format.symbolFirst"
                class="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground"
                aria-hidden="true"
                data-money-symbol
            >
                {{ format.symbol }}
            </span>

            <Input
                type="text"
                inputmode="decimal"
                autocomplete="off"
                :id="name"
                :model-value="text"
                :placeholder="placeholder ?? display(0)"
                :disabled="disabled"
                :readonly="readonly"
                :aria-invalid="invalid || Boolean(error) ? 'true' : undefined"
                :aria-describedby="name ? `${name}-currency` : undefined"
                :class="cn('flex-1 text-right tabular-nums', format.symbolFirst ? 'rounded-l-none' : 'rounded-r-none')"
                @update:model-value="onInput"
                @beforeinput="onBeforeInput"
                @blur="onBlur"
            />

            <span
                v-if="!format.symbolFirst"
                class="inline-flex items-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground"
                aria-hidden="true"
                data-money-symbol
            >
                {{ format.symbol }}
            </span>

            <span v-if="name" :id="`${name}-currency`" class="sr-only">{{ currency }}</span>

            <input v-if="name" type="hidden" :name="name" :value="typeof modelValue === 'number' ? String(modelValue) : ''" />
        </div>
    </BaseField>
</template>
