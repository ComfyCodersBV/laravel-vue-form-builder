<script setup lang="ts">
import { cn } from '../../lib/utils'
import type { SelectOption } from '../../lib/options'

const props = withDefaults(defineProps<{
    option: SelectOption
    codeWidth?: number | null
    html?: boolean
    labelClass?: string
    tag?: 'span' | 'div'
}>(), {
    codeWidth: null,
    html: false,
    labelClass: 'truncate',
    tag: 'span',
})
</script>

<template>
    <template v-if="props.codeWidth === null">
        <component :is="props.tag" v-if="props.html" :class="props.labelClass" v-html="props.option.label"></component>
        <component :is="props.tag" v-else :class="props.labelClass">{{ props.option.label }}</component>
    </template>
    <component :is="props.tag" v-else class="flex w-full min-w-0 items-center gap-3">
        <span class="shrink-0 tabular-nums" :style="{ minWidth: `${props.codeWidth}ch` }" data-option-code>{{ props.option.code ?? '' }}</span>
        <component :is="props.tag" v-if="props.html" :class="cn('min-w-0 flex-1', props.labelClass)" v-html="props.option.label"></component>
        <component :is="props.tag" v-else :class="cn('min-w-0 flex-1', props.labelClass)">{{ props.option.label }}</component>
    </component>
</template>
