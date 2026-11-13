<script setup lang="ts">
import { computed, inject } from 'vue'
import { useFormMessages } from '../../lib/messages'
import { DEFAULT_THEME, mergeTheme, themeKey, type FormTheme } from '../../lib/theme'

const props = defineProps<{ theme?: Partial<FormTheme> }>()

const formTheme = inject(themeKey, computed(() => DEFAULT_THEME))

const className = computed(() => mergeTheme(formTheme.value, props.theme).required)

const messageContext = useFormMessages()
</script>

<template>
    <span aria-hidden="true" :class="className" data-required-mark>*</span>
    <span class="sr-only"> ({{ messageContext.messages.required }})</span>
</template>
