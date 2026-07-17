<script setup lang="ts">
import BaseField from './BaseField.vue'
import type {Field} from '../../types/form-builder'
import {Button} from '../ui/button'
import {computed, ref, watch} from 'vue'
import {ArrowDown, ArrowUp, Plus, Trash2} from 'lucide-vue-next'
// FormRenderer and RepeaterField reference each other (FormRenderer registers
// RepeaterField in its component map; RepeaterField renders each row's
// sub-fields through FormRenderer). The mutual import is resolved at render
// time, so a static import is safe here.
import FormRenderer from '../FormRenderer.vue'

interface RepeaterProps extends Field {
    fields?: Field[]
    addActionLabel?: string
    itemLabel?: string
    inline?: boolean
    min?: number
    max?: number
    addable?: boolean
    deletable?: boolean
    reorderable?: boolean
}

const props = withDefaults(defineProps<RepeaterProps>(), {
    className: undefined,
    error: undefined,
    label: undefined,
    help: undefined,
    name: undefined,
    modelValue: undefined,
    fields: () => [],
    addActionLabel: 'Add item',
    itemLabel: undefined,
    inline: false,
    min: undefined,
    max: undefined,
    addable: true,
    deletable: true,
    reorderable: false,
})

const emit = defineEmits<{ 'update:modelValue': [Array<Record<string, any>>] }>()

const rows = ref<Record<string, any>[]>([])
const isInternalUpdate = ref(false)

function blankRow(): Record<string, any> {
    const row: Record<string, any> = {}
    for (const field of props.fields) {
        if (field.name) {
            row[field.name] = field.default ?? null
        }
    }
    return row
}

function normalizeToRows(input: any): Record<string, any>[] {
    if (!Array.isArray(input)) {
        return []
    }
    return input.map((item) => {
        const row: Record<string, any> = {}
        for (const field of props.fields) {
            if (field.name) {
                row[field.name] = item?.[field.name] ?? null
            }
        }
        return row
    })
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

watch(
    rows,
    () => {
        isInternalUpdate.value = true
        emit('update:modelValue', rows.value.map((row) => ({...row})))
    },
    {deep: true}
)

// Each row is rendered by FormRenderer, which expects a form-like object
// exposing `form[fieldName]` and `form.errors`. A per-row proxy maps reads
// and writes straight onto the reactive row object. Proxies are memoised so
// FormRenderer receives a stable `form` prop across re-renders.
const emptyErrors: Record<string, any> = {}
const formCache = new WeakMap<object, any>()

function rowForm(row: Record<string, any>) {
    const cached = formCache.get(row)
    if (cached) {
        return cached
    }

    const proxy = new Proxy(row, {
        get(target, prop) {
            if (prop === 'errors') {
                return emptyErrors
            }
            return Reflect.get(target, prop)
        },
        set(target, prop, value) {
            return Reflect.set(target, prop, value)
        },
    })

    formCache.set(row, proxy)
    return proxy
}

const canAdd = computed(() =>
    props.addable && (props.max === undefined || rows.value.length < props.max)
)

function canDelete(): boolean {
    return props.deletable && (props.min === undefined || rows.value.length > props.min)
}

function addRow() {
    if (!canAdd.value) {
        return
    }
    rows.value.push(blankRow())
}

function removeRow(idx: number) {
    if (!canDelete()) {
        return
    }
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
</script>

<template>
    <BaseField v-bind="{ label, name, error, className, help }">
        <div class="space-y-3">
            <div v-for="(row, i) in rows" :key="i"
                 class="rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
                <div class="mb-2 flex items-center justify-between">
                    <span class="text-xs font-medium text-neutral-500">
                        {{ itemLabel ? `${itemLabel} ${i + 1}` : `#${i + 1}` }}
                    </span>
                    <div class="flex items-center gap-1">
                        <Button v-if="reorderable" type="button" size="icon" variant="outline"
                                :disabled="i === 0" @click="moveUp(i)">
                            <ArrowUp class="size-4"/>
                        </Button>
                        <Button v-if="reorderable" type="button" size="icon" variant="outline"
                                :disabled="i === rows.length - 1" @click="moveDown(i)">
                            <ArrowDown class="size-4"/>
                        </Button>
                        <Button v-if="deletable" type="button" size="icon" variant="destructive"
                                :disabled="!canDelete()" @click="removeRow(i)">
                            <Trash2 class="size-4"/>
                        </Button>
                    </div>
                </div>

                <div :class="inline ? 'flex flex-wrap items-start gap-3' : 'space-y-3'">
                    <FormRenderer :fields="fields" :form="rowForm(row)"/>
                </div>
            </div>

            <p v-if="!rows.length" class="text-sm text-neutral-500">
                {{ addActionLabel }}
            </p>

            <div>
                <Button v-if="canAdd" type="button" variant="outline" @click="addRow">
                    <Plus class="size-4"/>
                    <span>{{ addActionLabel }}</span>
                </Button>
            </div>
        </div>
    </BaseField>
</template>
