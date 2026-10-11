<script setup lang="ts">
import { computed, inject } from 'vue'
import type { Field } from '../../types/form-builder'
import { DEFAULT_THEME, mergeTheme, themeKey, type FormTheme } from '../../lib/theme'
import { layoutKey, type FormLayout } from '../../lib/layout'
import { useHiddenLabel, VISUALLY_HIDDEN } from '../../lib/label'

interface BaseFieldProps extends Field {
    theme?: Partial<FormTheme>
    inlineLabel?: boolean
}

const props = withDefaults(defineProps<BaseFieldProps>(), {
    className: undefined,
    error: undefined,
    help: undefined,
    label: undefined,
    name: undefined,
    theme: undefined,
    hideLabel: false,
    inlineLabel: false,
})

const formTheme = inject(themeKey, computed(() => DEFAULT_THEME))

const theme = computed(() => mergeTheme(formTheme.value, props.theme))

/**
 * `->class()` predates the theme and replaces the wrapper outright rather than
 * merging into it, because that is what it has always done. Use
 * `->theme(['wrapper' => '...'])` to add to the wrapper instead of replacing it.
 */
const wrapperClass = computed(() => props.className ?? theme.value.wrapper)

const layout = inject(layoutKey, computed((): FormLayout => 'stacked'))

const labelHidden = useHiddenLabel(() => props.hideLabel)

const isHorizontal = computed(() => layout.value === 'horizontal' && Boolean(props.label) && !labelHidden.value)

const alignsWithControls = computed(() => layout.value === 'horizontal' && props.inlineLabel && !props.label)
</script>

<template>
    <div v-if="isHorizontal" :class="[wrapperClass, 'sm:flex sm:items-start sm:gap-3']">
        <label :for="name" :class="[theme.label, 'sm:w-40 sm:shrink-0 sm:pt-2 sm:text-right']">{{ label }}</label>
        <div class="min-w-0 flex-1">
            <slot />
            <div v-if="help" :class="theme.help" v-html="help"></div>
            <p v-if="error" :class="theme.error">
                <span v-if="Array.isArray(error)">{{ error[0] }}</span>
                <span v-else>{{ error }}</span>
            </p>
        </div>
    </div>

    <div v-else :class="[wrapperClass, alignsWithControls ? 'sm:pl-[10.75rem]' : '']">
        <label v-if="label" :for="name" :class="labelHidden ? VISUALLY_HIDDEN : theme.label">{{ label }}</label>
        <div>
            <slot />
        </div>
        <div v-if="help" :class="theme.help" v-html="help"></div>
        <p v-if="error" :class="theme.error">
            <span v-if="Array.isArray(error)">{{ error[0] }}</span>
            <span v-else>{{ error }}</span>
        </p>
    </div>
</template>
