<script setup lang="ts">
import BaseField from './BaseField.vue'
import type { Field } from '../../types/form-builder'
import { Input } from '../ui/input'
import { Popover, PopoverAnchor, PopoverContent } from '../ui/popover'
import { Clock, X } from 'lucide-vue-next'
import { computed, nextTick, ref, watch } from 'vue'
import { buildTimeSlots, closestSlotIndex, currentMinutes, minutesOf, normalizeTime, stepTime } from '../../lib/time'

interface TimeFieldProps extends Field {
    step?: number | string
    min?: string
    max?: string
    clearable?: boolean
    clearLabel?: string
}

const props = withDefaults(defineProps<TimeFieldProps>(), {
    className: undefined,
    clearable: false,
    clearLabel: 'Clear field',
    disabled: false,
    error: undefined,
    label: undefined,
    max: undefined,
    min: undefined,
    modelValue: null,
    name: undefined,
    placeholder: undefined,
    readonly: false,
    step: 15,
})

const emit = defineEmits<{ 'update:modelValue': [string | null] }>()

const text = ref('')
const invalid = ref(false)
const open = ref(false)
const highlighted = ref(-1)
const anchor = ref<HTMLElement | null>(null)
const list = ref<HTMLElement | null>(null)

const listId = computed(() => `${props.name ?? 'time'}-options`)
const slots = computed(() => buildTimeSlots(props.step, props.min, props.max))
const isLocked = computed(() => Boolean(props.disabled) || Boolean(props.readonly))
const isClearable = computed(() => props.clearable && !isLocked.value && text.value !== '')

watch(
    () => props.modelValue,
    (value) => {
        const next = typeof value === 'string' ? value.replace(/^(\d{2}:\d{2}):\d{2}$/, '$1') : ''

        if (next === text.value) {
            return
        }

        text.value = next
        invalid.value = next !== '' && minutesOf(next) === null
    },
    { immediate: true },
)

function emitValue(value: string | null): void {
    const current = typeof props.modelValue === 'string' && props.modelValue !== '' ? props.modelValue : null

    if (value === current) {
        return
    }

    emit('update:modelValue', value)
}

function scrollToHighlighted(): void {
    nextTick(() => {
        const option = list.value?.querySelector<HTMLElement>(`[data-index="${highlighted.value}"]`)

        if (!list.value || !option) {
            return
        }

        list.value.scrollTop = option.offsetTop - list.value.clientHeight / 2 + option.clientHeight / 2
    })
}

function referenceMinutes(): number {
    return minutesOf(normalizeTime(text.value).value) ?? currentMinutes()
}

function openList(): void {
    if (isLocked.value) {
        return
    }

    highlighted.value = closestSlotIndex(slots.value, referenceMinutes())
    open.value = true
    scrollToHighlighted()
}

function closeList(): void {
    open.value = false
}

function commit(): void {
    const result = normalizeTime(text.value)

    if (!result.valid) {
        invalid.value = true
        emitValue(text.value)

        return
    }

    invalid.value = false
    text.value = result.value ?? ''
    emitValue(result.value)
}

function select(slot: string): void {
    text.value = slot
    invalid.value = false
    emitValue(slot)
    closeList()
}

function move(direction: 1 | -1): void {
    if (isLocked.value) {
        return
    }

    const next = stepTime(slots.value, referenceMinutes(), direction)

    if (next === null) {
        return
    }

    text.value = next
    invalid.value = false
    emitValue(next)
    highlighted.value = slots.value.indexOf(next)
    open.value = true
    scrollToHighlighted()
}

function onInput(value: string | number): void {
    text.value = String(value)
    invalid.value = false
}

function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        move(event.key === 'ArrowDown' ? 1 : -1)

        return
    }

    if (event.key === 'Enter') {
        if (open.value) {
            event.preventDefault()
        }

        commit()
        closeList()

        return
    }

    if (event.key === 'Escape' && open.value) {
        event.preventDefault()
        closeList()
    }
}

function onBlur(): void {
    commit()
    closeList()
}

function onInteractOutside(event: Event): void {
    if (anchor.value?.contains(event.target as Node)) {
        event.preventDefault()
    }
}

function clear(): void {
    text.value = ''
    invalid.value = false
    emitValue(null)
}
</script>

<template>
    <BaseField v-bind="{ label, name, error, className, help, theme }">
        <Popover :open="open" @update:open="(value: boolean) => { open = value }">
            <div class="flex items-center gap-1">
                <PopoverAnchor as-child>
                    <div ref="anchor" class="relative w-full">
                        <Clock class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            :id="name"
                            :name="name"
                            :model-value="text"
                            :disabled="!!disabled"
                            :readonly="!!readonly"
                            :placeholder="placeholder ?? 'HH:MM'"
                            :aria-invalid="invalid || undefined"
                            :aria-expanded="open"
                            :aria-controls="listId"
                            role="combobox"
                            aria-autocomplete="none"
                            autocomplete="off"
                            inputmode="numeric"
                            class="pl-9 dark:text-neutral-100"
                            @update:model-value="onInput"
                            @focus="openList"
                            @click="openList"
                            @blur="onBlur"
                            @keydown="onKeydown"
                        />
                    </div>
                </PopoverAnchor>

                <button
                    v-if="isClearable"
                    type="button"
                    class="shrink-0 cursor-pointer rounded-md border border-input p-2 text-muted-foreground hover:text-foreground"
                    :title="clearLabel"
                    :aria-label="clearLabel"
                    @click="clear"
                >
                    <X class="size-4" />
                </button>
            </div>

            <PopoverContent
                align="start"
                class="w-[var(--reka-popover-trigger-width)] min-w-32 p-1"
                @open-auto-focus.prevent
                @close-auto-focus.prevent
                @interact-outside="onInteractOutside"
            >
                <div
                    :id="listId"
                    ref="list"
                    role="listbox"
                    class="relative max-h-60 overflow-auto"
                    @mousedown.prevent
                >
                    <button
                        v-for="(slot, index) in slots"
                        :key="slot"
                        type="button"
                        role="option"
                        tabindex="-1"
                        :data-index="index"
                        :aria-selected="slot === text"
                        class="flex w-full items-center rounded px-2 py-1.5 text-left text-sm tabular-nums hover:bg-accent"
                        :class="[
                            index === highlighted ? 'bg-accent' : '',
                            slot === text ? 'font-medium' : '',
                        ]"
                        @click="select(slot)"
                    >
                        {{ slot }}
                    </button>
                </div>
            </PopoverContent>
        </Popover>
    </BaseField>
</template>
