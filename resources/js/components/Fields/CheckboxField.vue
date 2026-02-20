<script setup lang="ts">
import BaseField from './BaseField.vue'
import { Checkbox } from '../ui/checkbox'
import { Label } from '../ui/label'
import { computed } from 'vue'

const props = defineProps<{
    modelValue?: any
    value?: string | number | boolean
    falseValue?: string | number | boolean
    name: string
    label?: string
    error?: string
    help?: string
    disabled?: boolean
    readonly?: boolean
}>()

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
    <BaseField :label="label" :name="name" :error="error" :help="help">
        <div class="flex items-center gap-2">
            <input type="hidden" :name="name" :value="String(falseValue ?? '0')" />
            <Checkbox
                :id="`${name}-cb`"
                :name="name"
                :value="String(value ?? '1')"
                v-model="isChecked"
                :disabled="disabled"
            />
            <Label v-if="label" :for="`${name}-cb`">{{ label }}</Label>
        </div>
    </BaseField>
</template>
