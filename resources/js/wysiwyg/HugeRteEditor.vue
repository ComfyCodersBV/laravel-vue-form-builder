<script setup lang="ts">
import Editor from '@hugerte/hugerte-vue'
import 'hugerte/hugerte'
import 'hugerte/icons/default'
import 'hugerte/models/dom'
import 'hugerte/themes/silver'
import 'hugerte/skins/ui/oxide/skin.css'
import contentStyle from 'hugerte/skins/content/default/content.css?inline'
import { computed } from 'vue'
import type { WysiwygAdapterProps } from './types'

/**
 * HugeRTE — the MIT-licensed community fork of TinyMCE 6.
 *
 * The engine is imported here rather than loaded from a CDN, which is why the
 * theme, model, icon pack and skin come along: the Vue wrapper reads
 * `globalThis.hugerte`, and those side-effect imports are what put it there.
 * Nothing else in this package imports this file.
 *
 * Plugins are deliberately absent. Which ones a form needs is the consumer's
 * decision, and in a bundled setup each one has to be imported by the
 * application that asks for it — see the WYSIWYG documentation.
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
 * adapter contract requires. What is pinned first are the settings that would
 * otherwise send the engine to the network: `skin` and `content_css` are set to
 * false because the bundler has already inlined both, and without that the
 * engine requests them over HTTP, fails, and renders an editor with no toolbar
 * and unstyled content. Each remains overridable on purpose.
 */
const init = computed(() => ({
    license_key: 'gpl',
    promotion: false,
    branding: false,
    skin: false,
    content_css: false,
    content_style: contentStyle,
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
