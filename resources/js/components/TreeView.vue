<script setup lang="ts">
import { computed, inject, provide, ref, type InjectionKey, type Ref } from 'vue'
import { ChevronDown, ChevronRight, GripVertical } from '@lucide/vue'
import { cn } from '../lib/utils'
import { useFormMessages } from '../lib/messages'

const messageContext = useFormMessages()

export interface TreeNode {
    id: string | number
    label: string
    children?: TreeNode[]
    [key: string]: any
}

export interface TreeDropEvent {
    dragged: TreeNode
    target: TreeNode | null
    position: 'before' | 'after' | 'inside'
}

const props = withDefaults(defineProps<{
    nodes: TreeNode[]
    modelValue?: string | number | null
    draggable?: boolean
    expandedIds?: (string | number)[]
}>(), {
    modelValue: null,
    draggable: false,
    expandedIds: () => [],
})

const emit = defineEmits<{
    'update:modelValue': [string | number | null]
    drop: [TreeDropEvent]
}>()

defineSlots<{
    actions?: (props: { node: TreeNode }) => any
}>()

interface DragState {
    dragged: Ref<TreeNode | null>
    dropTarget: Ref<{ id: string | number; position: TreeDropEvent['position'] } | null>
}

const dragStateKey: InjectionKey<DragState> = Symbol.for('form-builder-tree-drag')

const inherited = inject(dragStateKey, null)
const dragState: DragState = inherited ?? {
    dragged: ref<TreeNode | null>(null),
    dropTarget: ref<{ id: string | number; position: TreeDropEvent['position'] } | null>(null),
}

if (!inherited) {
    provide(dragStateKey, dragState)
}

const expanded = ref<Set<string | number>>(new Set(props.expandedIds))
const dragged = dragState.dragged
const dropTarget = dragState.dropTarget

const selectedId = computed(() => props.modelValue)

function isExpanded(node: TreeNode): boolean {
    return expanded.value.has(node.id)
}

function toggle(node: TreeNode): void {
    const next = new Set(expanded.value)

    if (next.has(node.id)) {
        next.delete(node.id)
    } else {
        next.add(node.id)
    }

    expanded.value = next
}

function select(node: TreeNode): void {
    emit('update:modelValue', node.id)
}

function hasChildren(node: TreeNode): boolean {
    return Array.isArray(node.children) && node.children.length > 0
}

function canDrag(node: TreeNode): boolean {
    return props.draggable && node.draggable !== false
}

function startDrag(node: TreeNode, event: DragEvent): void {
    if (!canDrag(node)) {
        event.preventDefault()

        return
    }

    dragged.value = node
    event.dataTransfer?.setData('text/plain', String(node.id))
}

function positionFor(event: DragEvent, element: HTMLElement): TreeDropEvent['position'] {
    const bounds = element.getBoundingClientRect()
    const offset = (event.clientY - bounds.top) / bounds.height

    if (offset < 0.25) {
        return 'before'
    }

    if (offset > 0.75) {
        return 'after'
    }

    return 'inside'
}

function dragOver(node: TreeNode, event: DragEvent): void {
    if (!props.draggable || !dragged.value || dragged.value.id === node.id || contains(dragged.value, node.id)) {
        return
    }

    event.preventDefault()
    dropTarget.value = { id: node.id, position: positionFor(event, event.currentTarget as HTMLElement) }
}

function contains(parent: TreeNode, id: string | number): boolean {
    return (parent.children ?? []).some((child) => child.id === id || contains(child, id))
}

function leave(node: TreeNode): void {
    if (dropTarget.value?.id === node.id) {
        dropTarget.value = null
    }
}

function drop(node: TreeNode): void {
    if (!dragged.value || !dropTarget.value || dragged.value.id === node.id) {
        return reset()
    }

    emit('drop', { dragged: dragged.value, target: node, position: dropTarget.value.position })

    reset()
}

function reset(): void {
    dragged.value = null
    dropTarget.value = null
}

function indicatorClass(node: TreeNode): string {
    if (dropTarget.value?.id !== node.id) {
        return ''
    }

    if (dropTarget.value.position === 'before') {
        return 'border-t-2 border-t-primary'
    }

    if (dropTarget.value.position === 'after') {
        return 'border-b-2 border-b-primary'
    }

    return 'bg-accent ring-1 ring-primary'
}
</script>

<template>
    <ul class="space-y-0.5" role="tree">
        <li v-for="node in nodes" :key="node.id" role="treeitem" :aria-expanded="hasChildren(node) ? isExpanded(node) : undefined">
            <div
                :class="cn(
                    'flex items-center gap-1 rounded-md px-1.5 py-1 text-sm',
                    selectedId === node.id ? 'bg-accent font-medium' : 'hover:bg-muted/60',
                    indicatorClass(node),
                )"
                :draggable="canDrag(node)"
                :data-tree-node="node.id"
                @dragstart="startDrag(node, $event)"
                @dragover="dragOver(node, $event)"
                @dragleave="leave(node)"
                @drop.prevent="drop(node)"
                @dragend="reset"
            >
                <GripVertical v-if="canDrag(node)" class="size-3.5 shrink-0 cursor-grab text-muted-foreground" />
                <span v-else-if="draggable" class="size-3.5 shrink-0" />

                <button
                    v-if="hasChildren(node)"
                    type="button"
                    class="shrink-0 text-muted-foreground"
                    :aria-label="isExpanded(node) ? messageContext.messages.collapse : messageContext.messages.expand"
                    @click.stop="toggle(node)"
                >
                    <ChevronDown v-if="isExpanded(node)" class="size-4" />
                    <ChevronRight v-else class="size-4" />
                </button>
                <span v-else class="size-4 shrink-0" />

                <button type="button" class="flex-1 truncate text-left" @click="select(node)">
                    {{ node.label }}
                </button>

                <slot name="actions" :node="node" />
            </div>

            <div v-if="hasChildren(node) && isExpanded(node)" class="ml-4 border-l pl-2">
                <TreeView
                    :nodes="node.children!"
                    :model-value="modelValue"
                    :draggable="draggable"
                    :expanded-ids="[...expanded]"
                    @update:model-value="emit('update:modelValue', $event)"
                    @drop="emit('drop', $event)"
                >
                    <template #actions="{ node: child }">
                        <slot name="actions" :node="child" />
                    </template>
                </TreeView>
            </div>
        </li>
    </ul>
</template>
