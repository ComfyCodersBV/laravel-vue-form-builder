<script setup lang="ts">
import { ref } from 'vue'
import { GripVertical } from 'lucide-vue-next'
import { cn } from '../lib/utils'

const props = withDefaults(defineProps<{
    modelValue: any[]
    itemKey?: string
    disabled?: boolean
}>(), {
    itemKey: 'id',
    disabled: false,
})

const emit = defineEmits<{
    'update:modelValue': [any[]]
    reorder: [{ from: number; to: number; items: any[] }]
}>()

const draggedIndex = ref<number | null>(null)
const overIndex = ref<number | null>(null)

function keyFor(item: any, index: number): string | number {
    return item?.[props.itemKey] ?? index
}

function startDrag(index: number, event: DragEvent): void {
    if (props.disabled) {
        return
    }

    draggedIndex.value = index
    event.dataTransfer!.effectAllowed = 'move'
    event.dataTransfer?.setData('text/plain', String(index))
}

function dragOver(index: number, event: DragEvent): void {
    if (props.disabled || draggedIndex.value === null) {
        return
    }

    event.preventDefault()
    overIndex.value = index
}

function drop(index: number): void {
    const from = draggedIndex.value

    reset()

    if (from === null || from === index) {
        return
    }

    const items = [...props.modelValue]
    const [moved] = items.splice(from, 1)
    items.splice(index, 0, moved)

    emit('update:modelValue', items)
    emit('reorder', { from, to: index, items })
}

function moveBy(index: number, offset: number): void {
    const target = index + offset

    if (props.disabled || target < 0 || target >= props.modelValue.length) {
        return
    }

    const items = [...props.modelValue]
    const [moved] = items.splice(index, 1)
    items.splice(target, 0, moved)

    emit('update:modelValue', items)
    emit('reorder', { from: index, to: target, items })
}

function reset(): void {
    draggedIndex.value = null
    overIndex.value = null
}
</script>

<template>
    <ul class="space-y-1">
        <li
            v-for="(item, index) in modelValue"
            :key="keyFor(item, index)"
            :draggable="!disabled"
            :class="cn(
                'flex items-center gap-2 rounded-md border bg-background px-2 py-1.5',
                draggedIndex === index ? 'opacity-50' : '',
                overIndex === index && draggedIndex !== index ? 'border-primary' : '',
            )"
            @dragstart="startDrag(index, $event)"
            @dragover="dragOver(index, $event)"
            @dragleave="overIndex = null"
            @drop.prevent="drop(index)"
            @dragend="reset"
        >
            <GripVertical
                v-if="!disabled"
                class="size-4 shrink-0 cursor-grab text-muted-foreground"
                aria-hidden="true"
            />

            <div class="min-w-0 flex-1">
                <slot :item="item" :index="index">{{ item }}</slot>
            </div>

            <div class="flex shrink-0 gap-0.5">
                <button
                    type="button"
                    class="rounded px-1 text-xs text-muted-foreground hover:bg-muted disabled:opacity-40"
                    :disabled="disabled || index === 0"
                    aria-label="Move up"
                    @click="moveBy(index, -1)"
                >
                    &uarr;
                </button>
                <button
                    type="button"
                    class="rounded px-1 text-xs text-muted-foreground hover:bg-muted disabled:opacity-40"
                    :disabled="disabled || index === modelValue.length - 1"
                    aria-label="Move down"
                    @click="moveBy(index, 1)"
                >
                    &darr;
                </button>
            </div>
        </li>
    </ul>
</template>
