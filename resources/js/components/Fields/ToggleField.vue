<script setup lang="ts">
import BaseField from './BaseField.vue'
import { Switch } from '../ui/switch'
import type { Field } from '../../types/form-builder'
import { computed } from 'vue'

type Props = Omit<Field, 'modelValue'> & {
    modelValue?: any
    value?: string | number | boolean
    falseValue?: string | number | boolean
}

const props = withDefaults(defineProps<Props>(), {
    disabled: false,
})

const emit = defineEmits<{ 'update:modelValue': [any] }>()

const model = computed<boolean>({
    get: () => {
        const mv = props.modelValue
        if (mv === undefined || mv === null || mv === '') {
            const defaultValue = (props as any).default

            if (defaultValue === undefined || defaultValue === null || defaultValue === '') {
                return false
            }

            if (typeof defaultValue === 'boolean') {
                return defaultValue
            }

            return String(defaultValue) === String(props.value ?? '1')
        }

        if (typeof mv === 'boolean') {
            return mv
        }

        return String(mv) === String(props.value ?? '1')
    },
    set: (checked: boolean) => {
        if (checked) {
            emit('update:modelValue', props.value ?? '1')
        } else {
            emit('update:modelValue', props.falseValue ?? '0')
        }
    },
})
</script>

<template>
    <BaseField :label="label" :name="name" :error="error" :help="help">
        <div class="flex items-center gap-2">
            <input type="hidden" :name="name" :value="String(falseValue ?? '0')" />
            <Switch
                :model-value="model"
                @update:model-value="(v) => model = v"
                :id="`${name}-tgl`" :name="name"
                :value="String(value ?? '1')"
                :disabled="disabled"
            />
            <label v-if="label" class="text-sm" :for="`${name}-tgl`">{{ label }}</label>
        </div>
    </BaseField>
</template>
