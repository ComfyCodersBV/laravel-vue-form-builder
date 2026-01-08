<script setup lang="ts">
import BaseField from './BaseField.vue';
import { computed } from 'vue';
import type { Field } from '../../types/form-builder';
import { Textarea } from '../ui/textarea';

interface Props extends Field {
    name: string
}

const props = withDefaults(defineProps<Props>(), {
    label: undefined,
    placeholder: '',
    modelValue: '',
    error: undefined,
    disabled: false,
    readonly: false,
})

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const model = computed<string>({
    get: () => (props.modelValue as any) ?? '',
    set: (v) => emit('update:modelValue', v),
})
</script>

<template>
    <BaseField :label="label" :name="name" :error="error" :help="help">
        <Textarea
            :id="name"
            :name="name"
            :disabled="disabled"
            :readonly="readonly"
            :placeholder="placeholder"
            v-model="model"
            rows="4"
        />
    </BaseField>
</template>
