<script setup lang="ts">
import Editor from '@hugerte/hugerte-vue'
import 'hugerte/hugerte'
import 'hugerte/icons/default'
import 'hugerte/models/dom'
import 'hugerte/themes/silver'
import 'hugerte/skins/ui/oxide/skin.css'
import { computed } from 'vue'
import type { WysiwygAdapterProps } from './types'

/**
 * HugeRTE — the MIT-licensed community fork of TinyMCE 6.
 *
 * The engine is imported here rather than loaded from a CDN, which is why the
 * theme, model, icon pack and skin are imported alongside it: the Vue wrapper
 * reads `globalThis.hugerte` and those side-effect imports are what put it
 * there. Nothing else in this package imports this file.
 */
const props = withDefaults(defineProps<WysiwygAdapterProps>(), {
    modelValue: '',
    config: () => ({}),
})

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const model = computed({
    get: () => props.modelValue ?? '',
    set: (value: string) => emit('update:modelValue', value),
})

/**
 * The consumer's `->options()` blob is handed to the engine untouched, as the
 * adapter contract requires. Only the two settings that would otherwise reach
 * for the network are pinned, and even those can be overridden deliberately.
 */
const init = computed(() => ({
    license_key: 'gpl',
    promotion: false,
    placeholder: props.placeholder,
    ...props.config,
}))
</script>

<template>
    <Editor
        v-model="model"
        :init="init"
        :disabled="props.disabled"
    />
</template>
