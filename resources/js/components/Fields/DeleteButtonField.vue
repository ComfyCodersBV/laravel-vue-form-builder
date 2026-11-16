<script setup lang="ts">
import ButtonField from './Button.vue';

interface Props {
    name?: string
    label?: string;
    labelHtml?: string;
    ariaLabel?: string;
    cancelLabel?: string;
    confirmTitle?: string;
    confirmMessage?: string;
    deleteUrl?: string;
    className?: string;
    inputClassName?: string;
    disabled?: boolean | string;
    labelExpression?: string;
    disabledIf?: string;
    form?: any;
}

defineProps<Props>();
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
        :delete-url="deleteUrl"
        :class-name="className"
        :input-class-name="inputClassName"
        :disabled="disabled"
        :label-expression="labelExpression"
        :disabled-if="disabledIf"
        :form="form"
        variant="destructive"
    />
</template>
