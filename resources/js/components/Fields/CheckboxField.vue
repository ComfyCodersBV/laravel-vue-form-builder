<script setup lang="ts">
import BaseField from './BaseField.vue'
import { Checkbox } from '../ui/checkbox'
import { Label } from '../ui/label'
import type { FormTheme } from '../../lib/theme'
import { computed } from 'vue'
import { useHiddenLabel, VISUALLY_HIDDEN } from '../../lib/label'

const props = defineProps<{
    modelValue?: any
    value?: string | number | boolean
    falseValue?: string | number | boolean
    name: string
    label?: string
    checkboxLabel?: string
    error?: string
    help?: string
    disabled?: boolean
    readonly?: boolean
    className?: string
    theme?: Partial<FormTheme>
    hideLabel?: boolean
}>()

const labelHidden = useHiddenLabel(() => props.hideLabel)

const groupLabel = computed(() => props.checkboxLabel ? props.label : undefined)

const inlineLabel = computed(() => props.checkboxLabel ?? props.label)

const emit = defineEmits<{ 'update:modelValue': [any] }>()

const isChecked = computed({
    get: () => {
        const value = props.modelValue
        if (value === undefined || value === null) {
            return false
        }

        if (typeof value === 'boolean') {
            return value
        }

        return String(value) === String(props.value ?? '1')
    },
    set: (checked: boolean) => {
        if (checked) {
            emit('update:modelValue', props.value ?? '1')
        } else {
            emit('update:modelValue', props.falseValue ?? '0')
        }
    }
})
</script>

<template>
    <BaseField :label="groupLabel" :name="name" :error="error" :help="help" :class-name="className" :theme="theme" :hide-label="hideLabel" inline-label>
        <div class="flex items-center gap-2">
            <input type="hidden" :name="name" :value="String(falseValue ?? '0')" />
            <Checkbox
                :id="`${name}-cb`"
                :name="name"
                :value="String(value ?? '1')"
                v-model="isChecked"
                :disabled="disabled"
            />
            <Label v-if="inlineLabel" :for="`${name}-cb`" :class="labelHidden && !checkboxLabel ? VISUALLY_HIDDEN : undefined">{{ inlineLabel }}</Label>
        </div>
    </BaseField>
</template>
