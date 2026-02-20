<script setup lang="ts">
import { computed } from 'vue'
import { Textarea } from '../../ui/textarea'
import type { HTMLAttributes } from 'vue'

const props = defineProps<{
    modelValue?: string
    placeholder?: string
    disabled?: boolean
    readonly?: boolean
    className?: HTMLAttributes['class']
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', v: string): void
}>()

const model = computed({
    get: () => props.modelValue ?? '',
    set: v => emit('update:modelValue', v),
})
</script>

<template>
    <Textarea
        v-model="model"
        :placeholder="props.placeholder"
        :disabled="props.disabled"
        :readonly="props.readonly"
        :class="props.className"
    />
</template>
