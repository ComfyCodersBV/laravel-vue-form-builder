<script setup lang="ts">
import { computed } from 'vue'
import { X } from 'lucide-vue-next'
import { cn } from '../lib/utils'

export interface TabItem {
    key: string
    label: string
    icon?: any
    closable?: boolean
    dirty?: boolean
    disabled?: boolean
}

const props = withDefaults(defineProps<{
    tabs: TabItem[]
    modelValue: string | null
    variant?: 'main' | 'sub'
}>(), {
    variant: 'main',
})

const emit = defineEmits<{
    'update:modelValue': [string]
    close: [TabItem]
}>()

const listClass = computed(() =>
    props.variant === 'main'
        ? 'flex items-end gap-1 border-b'
        : 'flex items-center gap-1 border-b bg-muted/40 px-1'
)

function tabClass(tab: TabItem): string {
    const active = tab.key === props.modelValue

    if (props.variant === 'main') {
        return cn(
            'flex items-center gap-1.5 rounded-t-md border border-b-0 px-3 py-2 text-sm',
            active
                ? 'border-b-2 border-b-primary bg-background font-medium text-primary'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted',
            tab.disabled ? 'pointer-events-none opacity-50' : '',
        )
    }

    return cn(
        'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm',
        active ? 'bg-primary/15 font-medium text-primary shadow-sm' : 'text-muted-foreground hover:bg-muted',
        tab.disabled ? 'pointer-events-none opacity-50' : '',
    )
}

function select(tab: TabItem): void {
    if (tab.disabled || tab.key === props.modelValue) {
        return
    }

    emit('update:modelValue', tab.key)
}
</script>

<template>
    <div :class="listClass" role="tablist">
        <div
            v-for="tab in tabs"
            :key="tab.key"
            role="tab"
            :aria-selected="tab.key === modelValue"
            :class="tabClass(tab)"
        >
            <button type="button" class="flex cursor-pointer items-center gap-1.5" @click="select(tab)">
                <component :is="tab.icon" v-if="tab.icon" class="size-4" />
                <span class="max-w-40 truncate">{{ tab.label }}</span>
                <span v-if="tab.dirty" class="size-1.5 rounded-full bg-amber-500" aria-label="Unsaved changes" />
            </button>

            <button
                v-if="tab.closable"
                type="button"
                class="cursor-pointer rounded text-muted-foreground hover:text-foreground"
                :aria-label="`Close ${tab.label}`"
                @click.stop="emit('close', tab)"
            >
                <X class="size-3.5" />
            </button>
        </div>

        <slot name="append" />
    </div>
</template>
