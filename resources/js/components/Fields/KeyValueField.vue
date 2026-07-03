<script setup lang="ts">
import BaseField from './BaseField.vue'
import type {Field} from '../../types/form-builder'
import {Input} from '../ui/input'
import {Button} from '../ui/button'
import {computed, ref, watch} from 'vue'
import {cn} from '../../lib/utils'
import {ArrowDown, ArrowUp, Eye, EyeOff, Plus, Trash2} from 'lucide-vue-next'

interface KeyValueProps extends Field {
    keyLabel?: string
    valueLabel?: string
    keyPlaceholder?: string
    valuePlaceholder?: string
    maskedValuePlaceholder?: string
    maskedKeyPattern?: string
    addActionLabel?: string
    editableKeys?: boolean
    editableValues?: boolean
    addable?: boolean
    deletable?: boolean
    reorderable?: boolean
    readonlyValueKeys?: string[]
}

const DEFAULT_MASKED_KEY_PATTERN = 'password|secret|token'

const props = withDefaults(defineProps<KeyValueProps>(), {
    className: undefined,
    error: undefined,
    label: undefined,
    help: undefined,
    name: undefined,
    modelValue: undefined,
    keyLabel: 'Key',
    valueLabel: 'Value',
    keyPlaceholder: 'Key',
    valuePlaceholder: 'Value',
    maskedValuePlaceholder: undefined,
    maskedKeyPattern: DEFAULT_MASKED_KEY_PATTERN,
    addActionLabel: 'Add row',
    editableKeys: true,
    editableValues: true,
    addable: true,
    deletable: true,
    reorderable: false,
    readonlyValueKeys: () => [],
})

const emit = defineEmits<{ 'update:modelValue': [Array<{ key: string; value: string }>] }>()

const rows = ref<{ key: string; value: string; hasStoredValue?: boolean }[]>([])
const isInternalUpdate = ref(false)
const revealed = ref<Record<number, boolean>>({})

function normalizeToRows(input: any): { key: string; value: string; hasStoredValue?: boolean }[] {
    if (!input) {
        return []
    }
    if (Array.isArray(input)) {
        return input.map(item => ({
            key: String(item.key ?? ''),
            value: item.value == null ? '' : String(item.value),
            hasStoredValue: Boolean(item.hasStoredValue),
        }))
    }
    if (typeof input === 'object') {
        return Object.entries(input as Record<string, any>).map(([k, v]) => ({
            key: String(k),
            value: v == null ? '' : String(v)
        }))
    }
    return []
}

const maskedKeyRegex = computed(() => {
    try {
        return new RegExp(props.maskedKeyPattern || DEFAULT_MASKED_KEY_PATTERN, 'i')
    } catch {
        return new RegExp(DEFAULT_MASKED_KEY_PATTERN, 'i')
    }
})

function isSensitiveKey(key: string): boolean {
    return maskedKeyRegex.value.test(key)
}

function toggleReveal(idx: number) {
    revealed.value[idx] = !revealed.value[idx]
}

watch(
    () => props.modelValue,
    (v) => {
        if (isInternalUpdate.value) {
            isInternalUpdate.value = false
            return
        }
        rows.value = normalizeToRows(v)
    },
    {immediate: true}
)

function emitObject() {
    const filteredRows = rows.value
        .filter(row => row.key.trim() !== '')
        .map(row => ({key: row.key, value: row.value}))
    isInternalUpdate.value = true
    emit('update:modelValue', filteredRows)
}

watch(rows, emitObject, {deep: true})

function addRow() {
    rows.value.push({
        key: '',
        value: '',
    })
}

function removeRow(idx: number) {
    rows.value.splice(idx, 1)
}

function moveUp(idx: number) {
    if (idx <= 0) {
        return
    }

    const tmp = rows.value[idx - 1]
    rows.value[idx - 1] = rows.value[idx]
    rows.value[idx] = tmp
}

function moveDown(idx: number) {
    if (idx >= rows.value.length - 1) {
        return
    }

    const tmp = rows.value[idx + 1]
    rows.value[idx + 1] = rows.value[idx]
    rows.value[idx] = tmp
}

const duplicateKeys = computed(() => {
    const seen = new Set<string>()
    const dups = new Set<string>()

    for (const r of rows.value) {
        if (!r.key) {
            continue
        }

        if (seen.has(r.key)) {
            dups.add(r.key)
        }

        seen.add(r.key)
    }
    return dups
})

function keyInputClass(k: string) {
    const dup = k && duplicateKeys.value.has(k)
    return cn(dup ? 'border-red-500 focus-visible:ring-red-200' : '')
}
</script>

<template>
    <BaseField v-bind="{ label, name, error, className, help }">
        <div class="space-y-2">
            <div class="grid grid-cols-12 gap-2 text-xs text-neutral-600">
                <div class="col-span-5">{{ keyLabel }}</div>
                <div class="col-span-5">{{ valueLabel }}</div>
                <div class="col-span-2"></div>
            </div>

            <div v-for="(row, i) in rows" :key="i" class="grid grid-cols-12 gap-2 items-center">
                <div class="col-span-5">
                    <Input :placeholder="keyPlaceholder" v-model="row.key" :readonly="!editableKeys"
                           :disabled="!editableKeys" :class="keyInputClass(row.key)"/>
                </div>
                <div class="col-span-5">
                    <div class="relative">
                        <Input
                            :placeholder="row.hasStoredValue && maskedValuePlaceholder ? maskedValuePlaceholder : valuePlaceholder"
                            :type="isSensitiveKey(row.key) && !revealed[i] ? 'password' : 'text'"
                            v-model="row.value"
                            :readonly="!editableValues || readonlyValueKeys.includes(row.key)"
                            :disabled="!editableValues || readonlyValueKeys.includes(row.key)"
                            :class="isSensitiveKey(row.key) ? 'pr-9' : ''"
                        />
                        <button v-if="isSensitiveKey(row.key)" type="button"
                                class="absolute inset-y-0 right-0 flex items-center px-2 text-neutral-500 hover:text-neutral-800"
                                :aria-label="revealed[i] ? 'Hide value' : 'Show value'" @click="toggleReveal(i)">
                            <EyeOff v-if="revealed[i]" class="size-4"/>
                            <Eye v-else class="size-4"/>
                        </button>
                    </div>
                </div>
                <div class="col-span-2 flex items-center gap-1 justify-end">
                    <Button v-if="reorderable" type="button" size="icon" variant="outline" @click="moveUp(i)">
                        <ArrowUp class="size-4"/>
                    </Button>
                    <Button v-if="reorderable" type="button" size="icon" variant="outline" @click="moveDown(i)">
                        <ArrowDown class="size-4"/>
                    </Button>
                    <Button v-if="deletable" type="button" size="icon" variant="destructive" @click="removeRow(i)">
                        <Trash2 class="size-4"/>
                    </Button>
                </div>

                <template v-if="name && row.key">
                    <input type="hidden" :name="`${name}[${row.key}]`" :value="row.value"/>
                </template>
            </div>

            <div>
                <Button v-if="addable" type="button" variant="outline" @click="addRow">
                    <Plus class="size-4"/>
                    <span>{{ addActionLabel }}</span>
                </Button>
            </div>

            <p v-if="duplicateKeys.size" class="text-xs text-red-600">Keys moeten uniek zijn.</p>
        </div>
    </BaseField>
</template>
