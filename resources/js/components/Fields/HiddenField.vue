<script setup lang="ts">
import type { Field } from '../../types/form-builder'
import { computed } from 'vue'

const props = withDefaults(defineProps<Field>(), {
    error: undefined,
    modelValue: '',
    name: undefined,
})

const emit = defineEmits<{ 'update:modelValue': [string | number] }>()

const model = computed<string | number>({
  get: () => (props.modelValue as any) ?? '',
  set: (v) => emit('update:modelValue', v as any),
})
</script>

<template>
    <div>
        <input type="hidden" :name="name" :id="name" v-model="model" />
        <p v-if="error" class="text-sm text-red-600">
            <span v-if="Array.isArray(error)">{{ error[0] }}</span>
            <span v-else>{{ error }}</span>
        </p>
    </div>
</template>
