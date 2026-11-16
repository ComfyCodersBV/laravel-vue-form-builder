<script setup lang="ts">
import { computed, inject } from 'vue'
import { useFieldId } from '../../lib/field-id'
import type { Field } from '../../types/form-builder'
import { DEFAULT_THEME, mergeTheme, themeKey, type FormTheme } from '../../lib/theme'
import { layoutKey, type FormLayout } from '../../lib/layout'
import { useHiddenLabel, VISUALLY_HIDDEN } from '../../lib/label'
import { useFieldMeta } from '../../lib/field-meta'
import RequiredMark from './RequiredMark.vue'

interface BaseFieldProps extends Field {
    theme?: Partial<FormTheme>
    inlineLabel?: boolean
    group?: boolean
}

const props = withDefaults(defineProps<BaseFieldProps>(), {
    className: undefined,
    error: undefined,
    help: undefined,
    helpText: undefined,
    markRequired: undefined,
    label: undefined,
    name: undefined,
    theme: undefined,
    hideLabel: false,
    inlineLabel: false,
    group: false,
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

const meta = useFieldMeta(() => ({ markRequired: props.markRequired, helpText: props.helpText }))

const hasHelp = computed(() => Boolean(meta.value.helpText || props.help))

const isHorizontal = computed(() => layout.value === 'horizontal' && Boolean(props.label) && !labelHidden.value)

const alignsWithControls = computed(() => layout.value === 'horizontal' && props.inlineLabel && !props.label)

const inputId = useFieldId(() => props.name)

const labelId = computed(() => props.group && inputId.value ? `${inputId.value}--label` : undefined)

const labelFor = computed(() => props.group ? undefined : inputId.value)
</script>

<template>
    <div v-if="isHorizontal" :class="[wrapperClass, 'sm:flex sm:items-start sm:gap-3']">
        <label :id="labelId" :for="labelFor" :class="[theme.label, 'sm:w-40 sm:shrink-0 sm:pt-2 sm:text-right']">{{ label }}<RequiredMark v-if="meta.markRequired" :theme="props.theme" /></label>
        <div class="min-w-0 flex-1">
            <slot />
            <template v-if="hasHelp">
                <div v-if="meta.helpText" :class="[theme.help, 'whitespace-pre-line']" data-help-text>{{ meta.helpText }}</div>
                <div v-else :class="theme.help" v-html="help"></div>
            </template>
            <p v-if="error" :class="theme.error">
                <span v-if="Array.isArray(error)">{{ error[0] }}</span>
                <span v-else>{{ error }}</span>
            </p>
        </div>
    </div>

    <div v-else :class="[wrapperClass, alignsWithControls ? 'sm:pl-[10.75rem]' : '']">
        <label v-if="label" :id="labelId" :for="labelFor" :class="labelHidden ? VISUALLY_HIDDEN : theme.label">{{ label }}<RequiredMark v-if="meta.markRequired" :theme="props.theme" /></label>
        <div>
            <slot />
        </div>
        <template v-if="hasHelp">
            <div v-if="meta.helpText" :class="[theme.help, 'whitespace-pre-line']" data-help-text>{{ meta.helpText }}</div>
            <div v-else :class="theme.help" v-html="help"></div>
        </template>
        <p v-if="error" :class="theme.error">
            <span v-if="Array.isArray(error)">{{ error[0] }}</span>
            <span v-else>{{ error }}</span>
        </p>
    </div>
</template>
