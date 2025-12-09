<script setup lang="ts">
import { Button } from '../ui/button'
import { cn } from '../../lib/utils';

interface Props {
    className?: string
    label?: string
}

withDefaults(defineProps<Props>(), {
    className: undefined,
    label: '',
})
</script>

<template>
    <Button
        type="button"
        :class="cn('inline-flex items-center rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800', className)"
    >
        {{ label }}
    </Button>
</template>
