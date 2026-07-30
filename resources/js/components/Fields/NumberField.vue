<script setup lang="ts">
import BaseField from './BaseField.vue';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { computed } from 'vue';
import type { Field } from '../../types/form-builder'
import { cn } from '../../lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Info, Minus, Plus } from 'lucide-vue-next';

interface NumberFieldProps extends Field {
    min?: number
    max?: number
    prepend?: string
    append?: string
    tooltip?: string
    step?: number | string
    stepper?: boolean
    decrementLabel?: string
    incrementLabel?: string
}

const props = withDefaults(defineProps<NumberFieldProps>(), {
    className: undefined,
    disabled: false,
    error: undefined,
    label: undefined,
    max: undefined,
    min: undefined,
    modelValue: '',
    name: undefined,
    placeholder: undefined,
    readonly: false,
    prepend: undefined,
    append: undefined,
    tooltip: undefined,
    step: 1,
    stepper: false,
    decrementLabel: 'Decrease',
    incrementLabel: 'Increase',
})

const emit = defineEmits<{ 'update:modelValue': [string | number] }>()

const model = computed<string | number>({
  get: () => (props.modelValue as any),
  set: (v) => emit('update:modelValue', v as any),
})

const hasPrepend = computed(() => !!props.prepend)
const hasAppend = computed(() => !!props.append)
const hasTooltip = computed(() => !!props.tooltip)
const hasRight = computed(() => hasAppend.value || hasTooltip.value)

const stepValue = computed(() => {
    const parsed = parseFloat(String(props.step ?? 1))

    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
})

const stepDecimals = computed(() => {
    const raw = String(props.step ?? '')
    const dotIndex = raw.indexOf('.')

    return dotIndex === -1 ? 0 : raw.length - dotIndex - 1
})

function round(value: number) {
    return Number(value.toFixed(stepDecimals.value))
}

function adjust(delta: number) {
    if (props.disabled || props.readonly) {
        return
    }

    const current = parseFloat(String(model.value)) || 0
    let next = round(current + delta)

    if (props.min !== undefined && next < props.min) {
        next = props.min
    }

    if (props.max !== undefined && next > props.max) {
        next = props.max
    }

    model.value = next
}

function decrement() {
    adjust(-stepValue.value)
}

function increment() {
    adjust(stepValue.value)
}

function rightRoundClass() {
    return hasRight.value ? 'rounded-r-none border-r-0' : ''
}

function leftRoundClass() {
    return hasPrepend.value ? 'rounded-l-none border-l-0' : ''
}

function onBeforeInput(e: InputEvent) {
    if (!e.data) {
        return
    }

    const next = (e.target as HTMLInputElement).value + e.data

    if (!/^-?\d*\.?\d*$/.test(next)) {
        e.preventDefault()
    }
}
</script>

<template>
        <BaseField v-bind="{ label, name, error, className, help }">
            <div class="flex w-full">
            <span
                v-if="prepend"
                class="inline-flex items-center rounded-l-md border border-input bg-muted px-3 text-sm text-muted-foreground"
            >
                {{ prepend }}
            </span>

                <Button
                    v-if="stepper"
                    type="button"
                    variant="outline"
                    size="icon"
                    class="shrink-0 rounded-r-none border-r-0"
                    :disabled="disabled || readonly"
                    :aria-label="decrementLabel"
                    @click="decrement"
                >
                    <Minus class="size-4" />
                </Button>

                <Input
                    type="text"
                    inputmode="numeric"
                    v-model="model"
                    @beforeinput="onBeforeInput"
                    :id="name"
                    :name="name"
                    :placeholder="placeholder"
                    :disabled="disabled"
                    :readonly="readonly"
                    :class="cn('flex-1', stepper ? 'rounded-none text-center' : cn(leftRoundClass(), rightRoundClass()))"
                />

                <Button
                    v-if="stepper"
                    type="button"
                    variant="outline"
                    size="icon"
                    class="shrink-0 rounded-l-none border-l-0"
                    :disabled="disabled || readonly"
                    :aria-label="incrementLabel"
                    @click="increment"
                >
                    <Plus class="size-4" />
                </Button>

                <span
                    v-if="append"
                    :class="cn(
                        'inline-flex items-center border border-l-0 border-input bg-muted px-3 text-sm ' +
                        'text-muted-foreground', tooltip ? 'rounded-r-none' : 'rounded-r-md'
                    )"
                >
                    {{ append }}
                </span>

                <Tooltip v-if="tooltip">
                    <TooltipTrigger as-child>
                        <button
                            type="button"
                            :class="cn(
                                'inline-flex items-center border border-l-0 border-input bg-muted px-2 ' +
                                'text-muted-foreground', append ? '' : 'rounded-r-md'
                            )"
                        >
                            <Info class="size-4" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {{ tooltip }}
                    </TooltipContent>
                </Tooltip>
            </div>
    </BaseField>
</template>
