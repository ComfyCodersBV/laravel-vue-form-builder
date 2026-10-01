<script setup lang="ts">
import { computed } from 'vue';
import ButtonField from './Button.vue';
import { cn } from '../../lib/utils';

interface Props {
    label?: string
    labelHtml?: string
    ariaLabel?: string
    cancelLabel?: string
    confirmTitle?: string
    confirmMessage?: string
    className?: string
}

const props = defineProps<Props>();

const mergedClassName = computed(() => cn('w-fit', props.className));
</script>

<template>
    <ButtonField
        :label="label"
        :label-html="labelHtml"
        :aria-label="ariaLabel"
        :cancel-label="cancelLabel"
        :confirm-title="confirmTitle"
        :confirm-message="confirmMessage"
        :class-name="mergedClassName"
        type="submit"
    />
</template>
