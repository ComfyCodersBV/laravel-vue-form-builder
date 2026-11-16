<script setup lang="ts">
import BaseField from './BaseField.vue'
import type {Field} from '../../types/form-builder'
import {Button} from '../ui/button'
import {computed, inject, provide, ref, toRaw, watch} from 'vue'
import {ArrowDown, ArrowUp, Plus, Trash2} from '@lucide/vue'
// FormRenderer and RepeaterField reference each other (FormRenderer registers
// RepeaterField in its component map; RepeaterField renders each row's
// sub-fields through FormRenderer). The mutual import is resolved at render
// time, so a static import is safe here.
import FormRenderer from '../FormRenderer.vue'
import { useFormMessages } from '../../lib/messages'
import { useFieldId } from '../../lib/field-id'
import { formFieldsKey } from '../../lib/fields'
import { DEFAULT_THEME, mergeTheme, themeKey } from '../../lib/theme'
import RequiredMark from './RequiredMark.vue'

interface RepeaterProps extends Field {
    fields?: Field[]
    addActionLabel?: string
    itemLabel?: string
    inline?: boolean
    table?: boolean
    min?: number
    max?: number
    addable?: boolean
    deletable?: boolean
    reorderable?: boolean
    entryErrors?: Record<string, string | string[]>
}

const props = withDefaults(defineProps<RepeaterProps>(), {
    className: undefined,
    error: undefined,
    label: undefined,
    help: undefined,
    name: undefined,
    modelValue: undefined,
    fields: () => [],
    addActionLabel: undefined,
    itemLabel: undefined,
    inline: false,
    table: false,
    min: undefined,
    max: undefined,
    addable: true,
    deletable: true,
    reorderable: false,
    entryErrors: () => ({}),
})

const emit = defineEmits<{ 'update:modelValue': [Array<Record<string, any>>] }>()

const messageContext = useFormMessages()
const messages = computed(() => messageContext.value.messages)

const repeaterId = useFieldId(() => props.name)

function rowIdPrefix(index: number): string | undefined {
    return repeaterId.value ? `${repeaterId.value}-${index}` : undefined
}

const rows = ref<Record<string, any>[]>([])
const isInternalUpdate = ref(false)

const rowKeys = new WeakMap<object, string>()
let nextRowKey = 0

function rowKey(row: Record<string, any>): string {
    const raw = toRaw(row)
    const existing = rowKeys.get(raw)

    if (existing) {
        return existing
    }

    nextRowKey += 1
    const key = `row-${nextRowKey}`
    rowKeys.set(raw, key)

    return key
}

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
const formCache = new WeakMap<object, any>()

const NO_ERRORS: Record<string, string | string[]> = {}

const errorsByRow = computed(() => {
    const byRow = new Map<object, Record<string, string | string[]>>()

    Object.entries(props.entryErrors).forEach(([key, message]) => {
        const [index, ...rest] = key.split('.')
        const row = /^\d+$/.test(index) ? rows.value[Number(index)] : undefined

        if (!row || rest.length === 0) {
            return
        }

        const raw = toRaw(row)
        const errors = byRow.get(raw) ?? {}
        errors[rest.join('.')] = message
        byRow.set(raw, errors)
    })

    return byRow
})

function rowErrors(row: Record<string, any>): Record<string, string | string[]> {
    return errorsByRow.value.get(toRaw(row)) ?? NO_ERRORS
}

function rowForm(row: Record<string, any>) {
    const cached = formCache.get(row)
    if (cached) {
        return cached
    }

    const proxy = new Proxy(row, {
        get(target, prop) {
            if (prop === 'errors') {
                return rowErrors(target)
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

provide(formFieldsKey, [...inject(formFieldsKey, []), ...props.fields])

const formTheme = inject(themeKey, computed(() => DEFAULT_THEME))

const tableColumns = computed(() => props.fields.filter((field) => field.type !== 'hidden'))

const tableHiddenFields = computed(() => props.fields.filter((field) => field.type === 'hidden'))

function headerHelpId(field: Field): string | undefined {
    if (!repeaterId.value || !field.name || !(field.helpText || field.help)) {
        return undefined
    }

    return `${repeaterId.value}-column-${field.name}-help`
}

const tableCells = computed(() => tableColumns.value.map((field) => [{
    ...field,
    hideLabel: true,
    help: undefined,
    helpText: undefined,
    'aria-describedby': headerHelpId(field),
}]))

function removeLabel(index: number): string {
    return messages.value.removeRow.replace(':number', String(index + 1))
}

const DEFAULT_COLUMN_WIDTH = '8rem'

const actionCount = computed(() => (props.reorderable ? 2 : 0) + (props.deletable ? 1 : 0))

const hasActionColumn = computed(() => actionCount.value > 0 || tableHiddenFields.value.length > 0)

const actionColumnWidth = computed(() => `${Math.max(1, actionCount.value * 2.5) + 0.5}rem`)

const tableMinWidth = computed(() => {
    const widths = tableColumns.value.map((field) => field.columnWidth ?? DEFAULT_COLUMN_WIDTH)

    if (hasActionColumn.value) {
        widths.push(actionColumnWidth.value)
    }

    return `calc(${widths.join(' + ')})`
})

function headerTheme(field: Field) {
    return mergeTheme(formTheme.value, field.theme)
}

const hasLabels = computed(() => props.fields.some((field) => Boolean(field.label) && !field.hideLabel && field.type !== 'hidden'))

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
    <BaseField v-bind="{ label, name, error, className, help, theme }">
        <div class="space-y-3">
            <div v-if="table && rows.length" class="overflow-x-auto" data-repeater-table>
                <table class="w-full table-fixed border-collapse" :aria-label="label" :style="{ minWidth: tableMinWidth }">
                    <colgroup>
                        <col v-for="(field, c) in tableColumns" :key="field.name ?? c" :style="field.columnWidth ? { width: field.columnWidth } : undefined">
                        <col v-if="hasActionColumn" :style="{ width: actionColumnWidth }">
                    </colgroup>
                    <thead>
                        <tr>
                            <th v-for="(field, c) in tableColumns" :key="field.name ?? c" scope="col"
                                class="px-1 pb-1 text-left align-bottom font-normal first:pl-0">
                                <span :class="headerTheme(field).label">{{ field.label }}<RequiredMark v-if="field.markRequired" :theme="field.theme"/></span>
                                <span v-if="field.helpText" :id="headerHelpId(field)" :class="[headerTheme(field).help, 'block whitespace-pre-line']" data-help-text>{{ field.helpText }}</span>
                                <span v-else-if="field.help" :id="headerHelpId(field)" :class="[headerTheme(field).help, 'block']" v-html="field.help"></span>
                            </th>
                            <th v-if="hasActionColumn" scope="col"><span class="sr-only">{{ messages.actions }}</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(row, i) in rows" :key="rowKey(row)" data-repeater-row>
                            <td v-for="(cell, c) in tableCells" :key="cell[0].name ?? c" class="px-1 py-1 align-top first:pl-0">
                                <FormRenderer :fields="cell" :form="rowForm(row)" :id-prefix="rowIdPrefix(i)" layout-from-form/>
                            </td>
                            <td v-if="hasActionColumn" class="py-1 pl-1 align-top">
                                <FormRenderer v-if="tableHiddenFields.length" :fields="tableHiddenFields" :form="rowForm(row)" :id-prefix="rowIdPrefix(i)" layout-from-form/>
                                <div class="flex items-center justify-end gap-1">
                                    <Button v-if="reorderable" type="button" size="icon" variant="outline"
                                            :disabled="i === 0" :aria-label="messages.moveUp" @click="moveUp(i)">
                                        <ArrowUp class="size-4"/>
                                    </Button>
                                    <Button v-if="reorderable" type="button" size="icon" variant="outline"
                                            :disabled="i === rows.length - 1" :aria-label="messages.moveDown" @click="moveDown(i)">
                                        <ArrowDown class="size-4"/>
                                    </Button>
                                    <Button v-if="deletable" type="button" size="icon" variant="destructive"
                                            :disabled="!canDelete()" :aria-label="removeLabel(i)" @click="removeRow(i)">
                                        <Trash2 class="size-4"/>
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <template v-else-if="inline">
                <div v-for="(row, i) in rows" :key="rowKey(row)"
                     class="flex flex-col gap-3 rounded-md border border-neutral-200 p-3 sm:flex-row sm:items-start sm:border-0 sm:p-0 dark:border-neutral-700"
                     data-repeater-row>
                    <div class="grid min-w-0 flex-1 gap-3 sm:auto-cols-fr sm:grid-flow-col">
                        <FormRenderer :fields="fields" :form="rowForm(row)" :id-prefix="rowIdPrefix(i)" layout-from-form/>
                    </div>
                    <div class="flex items-center justify-end gap-1" :class="{ 'sm:pt-6': hasLabels }">
                        <Button v-if="reorderable" type="button" size="icon" variant="outline"
                                :disabled="i === 0" :aria-label="messages.moveUp" @click="moveUp(i)">
                            <ArrowUp class="size-4"/>
                        </Button>
                        <Button v-if="reorderable" type="button" size="icon" variant="outline"
                                :disabled="i === rows.length - 1" :aria-label="messages.moveDown" @click="moveDown(i)">
                            <ArrowDown class="size-4"/>
                        </Button>
                        <Button v-if="deletable" type="button" size="icon" variant="destructive"
                                :disabled="!canDelete()" :aria-label="removeLabel(i)" @click="removeRow(i)">
                            <Trash2 class="size-4"/>
                        </Button>
                    </div>
                </div>
            </template>

            <template v-else>
                <div v-for="(row, i) in rows" :key="rowKey(row)"
                     class="rounded-md border border-neutral-200 p-3 dark:border-neutral-700"
                     data-repeater-row>
                    <div class="mb-2 flex items-center justify-between">
                        <span class="text-xs font-medium text-neutral-500">
                            {{ itemLabel ? `${itemLabel} ${i + 1}` : `#${i + 1}` }}
                        </span>
                        <div class="flex items-center gap-1">
                            <Button v-if="reorderable" type="button" size="icon" variant="outline"
                                    :disabled="i === 0" :aria-label="messages.moveUp" @click="moveUp(i)">
                                <ArrowUp class="size-4"/>
                            </Button>
                            <Button v-if="reorderable" type="button" size="icon" variant="outline"
                                    :disabled="i === rows.length - 1" :aria-label="messages.moveDown" @click="moveDown(i)">
                                <ArrowDown class="size-4"/>
                            </Button>
                            <Button v-if="deletable" type="button" size="icon" variant="destructive"
                                    :disabled="!canDelete()" :aria-label="removeLabel(i)" @click="removeRow(i)">
                                <Trash2 class="size-4"/>
                            </Button>
                        </div>
                    </div>

                    <div class="space-y-3">
                        <FormRenderer :fields="fields" :form="rowForm(row)" :id-prefix="rowIdPrefix(i)"/>
                    </div>
                </div>
            </template>

            <p v-if="!rows.length" class="text-sm text-neutral-500">
                {{ addActionLabel ?? messages.addItem }}
            </p>

            <div>
                <Button
                    v-if="canAdd"
                    type="button"
                    variant="outline"
                    :data-testid="props.name ? `field-${props.name}-add` : undefined"
                    @click="addRow"
                >
                    <Plus class="size-4"/>
                    <span>{{ addActionLabel ?? messages.addItem }}</span>
                </Button>
            </div>
        </div>
    </BaseField>
</template>
