<script setup lang="ts">
import { computed } from 'vue'
import BaseField from './BaseField.vue'
import { Textarea } from '../ui/textarea'
import type { Field } from '../../types/form-builder'

interface Props extends Field {
    name: string
    modelValue?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()

const model = computed({
    get: () => props.modelValue ?? '',
    set: v => emit('update:modelValue', v),
})
</script>

<template>
    <BaseField :label="label" :name="name" :error="error" :help="help">
        <Textarea
            v-model="model"
            :placeholder="placeholder"
            :disabled="disabled"
            :readonly="readonly"
            :class="className"
        />
    </BaseField>
</template>
