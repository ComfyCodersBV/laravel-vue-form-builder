<script setup lang="ts">
import { Button } from '../ui/button'

interface Props {
    label?: string
}

withDefaults(defineProps<Props>(), {
    label: 'Save',
})
</script>

<template>
    <Button type="submit" class="inline-flex items-center rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
        {{ label }}
    </Button>
</template>
