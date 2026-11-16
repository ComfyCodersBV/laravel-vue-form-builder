<script setup lang="ts">
import { computed } from 'vue';
import ButtonField from './Button.vue';
import { cn } from '../../lib/utils';

interface Props {
    name?: string
    label?: string
    labelHtml?: string
    ariaLabel?: string
    cancelLabel?: string
    confirmTitle?: string
    confirmMessage?: string
    className?: string
    inputClassName?: string
    disabled?: boolean | string
    labelExpression?: string
    disabledIf?: string
    form?: any
}

const props = defineProps<Props>();

const mergedClassName = computed(() => cn('w-fit', props.className));
</script>

<template>
    <ButtonField
        :name="name"
        :label="label"
        :label-html="labelHtml"
        :aria-label="ariaLabel"
        :cancel-label="cancelLabel"
        :confirm-title="confirmTitle"
        :confirm-message="confirmMessage"
        :class-name="mergedClassName"
        :input-class-name="inputClassName"
        :disabled="disabled"
        :label-expression="labelExpression"
        :disabled-if="disabledIf"
        :form="form"
        type="submit"
    />
</template>
