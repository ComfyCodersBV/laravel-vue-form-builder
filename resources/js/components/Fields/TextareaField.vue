<script setup lang="ts">
import BaseField from './BaseField.vue';
import { computed } from 'vue';
import type { Field } from '../../types/form-builder';

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
        <textarea
            :id="name"
            :name="name"
            :disabled="disabled"
            :readonly="readonly"
            :placeholder="placeholder"
            v-model="model"
            class="block w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none"
            rows="4"
        />
    </BaseField>
</template>
