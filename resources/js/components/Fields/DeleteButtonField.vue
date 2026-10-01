<script setup lang="ts">
import ButtonField from './Button.vue';

interface Props {
    label?: string;
    labelHtml?: string;
    ariaLabel?: string;
    cancelLabel?: string;
    confirmTitle?: string;
    confirmMessage?: string;
    deleteUrl?: string;
    className?: string;
}

defineProps<Props>();
</script>

<template>
    <ButtonField
        :label="label"
        :label-html="labelHtml"
        :aria-label="ariaLabel"
        :cancel-label="cancelLabel"
        :confirm-title="confirmTitle"
        :confirm-message="confirmMessage"
        :delete-url="deleteUrl"
        :class-name="className"
        variant="destructive"
    />
</template>
