<script setup lang="ts">
import ButtonField from './Button.vue';

interface Props {
    label?: string;
    cancelLabel?: string;
    confirmTitle?: string;
    confirmMessage?: string;
    deleteUrl?: string;
    className?: string;
}

withDefaults(defineProps<Props>(), {
    label: 'Delete',
    cancelLabel: 'Cancel',
    confirmTitle: 'Are you sure?',
    confirmMessage: 'This action cannot be undone. This will permanently delete this record.',
    deleteUrl: undefined,
    className: undefined,
});
</script>

<template>
    <ButtonField
        :label="label"
        :cancel-label="cancelLabel"
        :confirm-title="confirmTitle"
        :confirm-message="confirmMessage"
        :delete-url="deleteUrl"
        :class-name="className"
        variant="destructive"
    />
</template>