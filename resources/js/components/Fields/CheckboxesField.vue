<script setup lang="ts">
import BaseField from './BaseField.vue'
import { Checkbox } from '../ui/checkbox'
import { Label } from '../ui/label'
import type { Field } from '../../types/form-builder'
import { computed } from 'vue'

interface Option {
    value: string | number;
    label: string;
    disabled?: boolean
}

type Options = Record<string, string> | Array<Option> | Array<string | number>

type Props = Omit<Field, 'modelValue'> & {
    modelValue?: Array<string | number>
    options?: Options
    inline?: boolean
    buttons?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    options: () => ({} as Options),
    inline: false,
    buttons: false,
})

const emit = defineEmits<{ 'update:modelValue': [Array<string | number>] }>()

const optionsList = computed<Option[]>(() => {
    const o = props.options
    if (Array.isArray(o)) {
        return (o as Array<Option | string | number>).map((item) =>
            typeof item === 'string' || typeof item === 'number'
                ? {value: item, label: String(item)}
                : item
        )
    }
    const rec: Record<string, string> = o ?? {}
    return Object.entries(rec).map(([value, label]) => ({value, label}))
})

function getCheckboxModel(value: string | number) {
    return computed({
        get: () => {
            const current = Array.isArray(props.modelValue) ? props.modelValue : []
            return current.some(v => String(v) === String(value))
        },
        set: (checked: boolean) => {
            const current = Array.isArray(props.modelValue) ? [...props.modelValue] : []
            const key = String(value)
            const index = current.findIndex(v => String(v) === key)

            if (checked && index === -1) {
                current.push(key)
            } else if (!checked && index !== -1) {
                current.splice(index, 1)
            }

            emit('update:modelValue', current)
        }
    })
}

const selectedValues = computed(() => {
    const current = Array.isArray(props.modelValue) ? props.modelValue : []
    return current.map((v) => String(v))
})

function isSelected(value: string | number): boolean {
    return selectedValues.value.includes(String(value))
}

function toggle(value: string | number) {
    const current = Array.isArray(props.modelValue) ? [...props.modelValue] : []
    const key = String(value)
    const index = current.findIndex((v) => String(v) === key)

    if (index === -1) {
        current.push(key)
    } else {
        current.splice(index, 1)
    }

    emit('update:modelValue', current)
}
</script>

<template>
    <BaseField :label="label" :name="name" :error="error" :help="help">
        <div v-if="buttons" class="flex flex-wrap gap-2">
            <button v-for="option in optionsList" :key="String(option.value)" type="button"
                    :disabled="option.disabled || disabled"
                    class="rounded-full border px-3 py-1 text-xs uppercase tracking-wide transition disabled:opacity-50"
                    :class="isSelected(option.value)
                        ? 'border-transparent bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                        : 'border-neutral-300 text-neutral-600 hover:border-neutral-400 dark:border-neutral-600 dark:text-neutral-300'"
                    @click="toggle(option.value)">
                {{ option.label }}
            </button>
        </div>

        <div v-else :class="inline ? 'flex flex-wrap items-center gap-4' : 'grid gap-2'">
            <div v-for="option in optionsList" :key="String(option.value)"
                 :class="inline ? 'inline-flex items-center gap-2' : 'flex items-center gap-2'">
                <Checkbox :id="`${name}-${String(option.value)}`" :name="`${name}[]`" :value="String(option.value)"
                          :disabled="option.disabled || disabled" v-model="getCheckboxModel(option.value).value"/>
                <Label :for="`${name}-${String(option.value)}`">{{ option.label }}</Label>
            </div>
        </div>
        <template v-if="name">
            <input v-for="value in selectedValues" :key="`hidden-${value}`" type="hidden" :name="`${name}[]`"
                   :value="value"/>
        </template>
    </BaseField>
</template>
