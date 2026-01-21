<script setup lang="ts">
import type { Field } from '../../types/form-builder'

withDefaults(defineProps<Field>(), {
    className: 'space-y-1',
    error: undefined,
    help: undefined,
    label: undefined,
    name: undefined,
})
</script>

<template>
    <div :class="className">
        <label v-if="label" :for="name" class="block text-sm font-medium text-neutral-800 dark:text-neutral-200">{{ label }}</label>
        <div>
            <slot />
        </div>
        <div v-if="help" class="mt-1 text-xs text-neutral-500 dark:text-neutral-400" v-html="help"></div>
        <p v-if="error" class="text-sm text-red-600">
            <span v-if="Array.isArray(error)">{{ error[0] }}</span>
            <span v-else>{{ error }}</span>
        </p>
    </div>
</template>
