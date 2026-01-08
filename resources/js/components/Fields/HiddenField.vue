<script setup lang="ts">
import type { Field } from '../../types/form-builder'

withDefaults(defineProps<Field>(), {
    error: undefined,
    modelValue: '',
    name: undefined,
})
</script>

<template>
    <div>
        <input type="hidden" :name="name" :id="name" :value="(modelValue as any) ?? ''" />
        <p v-if="error" class="text-sm text-red-600">
            <span v-if="Array.isArray(error)">{{ error[0] }}</span>
            <span v-else>{{ error }}</span>
        </p>
    </div>
</template>
