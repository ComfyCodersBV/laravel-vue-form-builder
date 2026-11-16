<script setup lang="ts">
import BaseField from './BaseField.vue'
import { Checkbox } from '../ui/checkbox'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import type { Field } from '../../types/form-builder'
import { computed } from 'vue'
import { useFieldId } from '../../lib/field-id'
import { useFormMessages } from '../../lib/messages'
import { VISUALLY_HIDDEN } from '../../lib/label'

interface Option {
    value: string | number;
    label: string;
    disabled?: boolean
    [column: string]: unknown
}

interface OptionColumn {
    key: string
    label: string
}

type Options = Record<string, string | Record<string, unknown>> | Array<Option> | Array<string | number>

type Props = Omit<Field, 'modelValue' | 'options'> & {
    modelValue?: Array<string | number>
    options?: Options
    inline?: boolean
    buttons?: boolean
    optionColumns?: OptionColumn[]
    selectAll?: boolean
    optionLabel?: string
    optionValue?: string
}

const props = withDefaults(defineProps<Props>(), {
    options: () => ({} as Options),
    inline: false,
    buttons: false,
    optionColumns: () => [],
    selectAll: false,
    optionLabel: undefined,
    optionValue: undefined,
})

const emit = defineEmits<{ 'update:modelValue': [Array<string | number>] }>()

const messageContext = useFormMessages()
const messages = computed(() => messageContext.value.messages)

function readKey(row: Record<string, unknown>, key: string | undefined, fallbacks: string[]): unknown {
    return [key, ...fallbacks]
        .filter((candidate): candidate is string => typeof candidate === 'string' && candidate !== '')
        .map((candidate) => row[candidate])
        .find((value) => value !== undefined && value !== null)
}

function fromRow(row: Record<string, unknown>, mapKey?: string): Option {
    const value = mapKey ?? readKey(row, props.optionValue, ['value', 'id']) ?? ''
    const label = readKey(row, props.optionLabel, ['label', 'name']) ?? value

    return {...row, value: value as string | number, label: String(label)}
}

const optionsList = computed<Option[]>(() => {
    const o = props.options
    if (Array.isArray(o)) {
        return (o as Array<Record<string, unknown> | string | number>).map((item) =>
            typeof item === 'string' || typeof item === 'number'
                ? {value: item, label: String(item)}
                : fromRow(item)
        )
    }
    const rec = o ?? {}
    return Object.entries(rec).map(([value, label]) => typeof label === 'object' && label !== null
        ? fromRow(label as Record<string, unknown>, value)
        : {value, label: String(label)})
})

function getCheckboxModel(value: string | number) {
    return computed({
        get: () => {
            const current = Array.isArray(props.modelValue) ? props.modelValue : []
            return current.some(v => String(v) === String(value))
        },
        set: (checked: boolean) => {
            const current = Array.isArray(props.modelValue) ? [...props.modelValue] : []
            const key = String(value)
            const index = current.findIndex(v => String(v) === key)

            if (checked && index === -1) {
                current.push(key)
            } else if (!checked && index !== -1) {
                current.splice(index, 1)
            }

            emit('update:modelValue', current)
        }
    })
}

const selectedValues = computed(() => {
    const current = Array.isArray(props.modelValue) ? props.modelValue : []
    return current.map((v) => String(v))
})

function isSelected(value: string | number): boolean {
    return selectedValues.value.includes(String(value))
}

function toggle(value: string | number) {
    const current = Array.isArray(props.modelValue) ? [...props.modelValue] : []
    const key = String(value)
    const index = current.findIndex((v) => String(v) === key)

    if (index === -1) {
        current.push(key)
    } else {
        current.splice(index, 1)
    }

    emit('update:modelValue', current)
}

const isLocked = computed(() => Boolean(props.disabled) || Boolean(props.readonly))

const selectableValues = computed(() => optionsList.value
    .filter((option) => !option.disabled)
    .map((option) => String(option.value)))

const lockedSelection = computed(() => {
    const selectable = new Set(selectableValues.value)

    return selectedValues.value.filter((value) => !selectable.has(value))
})

const allSelected = computed(() => selectableValues.value.every((value) => selectedValues.value.includes(value)))

const noneSelected = computed(() => !selectableValues.value.some((value) => selectedValues.value.includes(value)))

function selectEvery(): void {
    emit('update:modelValue', [...lockedSelection.value, ...selectableValues.value])
}

function selectNothing(): void {
    emit('update:modelValue', [...lockedSelection.value])
}

const showsTable = computed(() => props.optionColumns.length > 0 && !props.buttons)

function cellText(option: Option, key: string): string {
    const value = option[key]

    return value === null || value === undefined ? '' : String(value)
}

const inputId = useFieldId(() => props.name)

const groupLabelId = computed(() => props.label && inputId.value ? `${inputId.value}--label` : undefined)

function optionId(option: Option): string {
    return `${inputId.value}-${String(option.value)}`
}
</script>

<template>
    <BaseField :label="label" :name="name" :error="error" :help="help" :class-name="className" :theme="theme" group>
        <div v-if="selectAll" class="mb-2 flex flex-wrap gap-2" data-select-all>
            <Button type="button" size="sm" variant="outline" :disabled="isLocked || allSelected" data-select-all-button @click="selectEvery">
                {{ messages.selectAll }}
            </Button>
            <Button type="button" size="sm" variant="outline" :disabled="isLocked || noneSelected" data-select-none-button @click="selectNothing">
                {{ messages.selectNone }}
            </Button>
        </div>

        <div v-if="buttons" class="flex flex-wrap gap-2" role="group" :aria-labelledby="groupLabelId">
            <button v-for="option in optionsList" :key="String(option.value)" type="button"
                    :disabled="option.disabled || disabled"
                    class="rounded-full border px-3 py-1 text-xs uppercase tracking-wide transition disabled:opacity-50"
                    :class="[
                        isSelected(option.value)
                            ? 'border-transparent bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                            : 'border-neutral-300 text-neutral-600 hover:border-neutral-400 dark:border-neutral-600 dark:text-neutral-300',
                        inputClassName,
                    ]"
                    @click="toggle(option.value)">
                {{ option.label }}
            </button>
        </div>

        <div v-else-if="showsTable" class="overflow-x-auto rounded-md border border-input" data-checkbox-table>
            <table class="w-full text-sm" :aria-labelledby="groupLabelId">
                <thead>
                    <tr class="border-b border-input bg-muted/50 text-left">
                        <th scope="col" class="w-10 px-3 py-2"><span :class="VISUALLY_HIDDEN">{{ messages.selectOption }}</span></th>
                        <th v-for="column in optionColumns" :key="column.key" scope="col" class="px-3 py-2 font-medium">
                            {{ column.label }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="option in optionsList" :key="String(option.value)"
                        class="border-b border-input last:border-b-0"
                        :class="option.disabled ? 'text-muted-foreground' : ''"
                        :data-option="String(option.value)">
                        <td class="px-3 py-2 align-middle">
                            <Checkbox :id="optionId(option)" :name="`${name}[]`" :value="String(option.value)"
                                      :aria-label="option.label"
                                      :disabled="option.disabled || disabled" :class="inputClassName"
                                      v-model="getCheckboxModel(option.value).value"/>
                        </td>
                        <td v-for="column in optionColumns" :key="column.key" class="px-3 py-2">
                            <label :for="optionId(option)" class="block" :class="option.disabled || disabled ? 'cursor-not-allowed' : 'cursor-pointer'">{{ cellText(option, column.key) }}</label>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-else :class="inline ? 'flex flex-wrap items-center gap-4' : 'grid gap-2'" role="group" :aria-labelledby="groupLabelId">
            <div v-for="option in optionsList" :key="String(option.value)"
                 :class="inline ? 'inline-flex items-center gap-2' : 'flex items-center gap-2'">
                <Checkbox :id="optionId(option)" :name="`${name}[]`" :value="String(option.value)"
                          :disabled="option.disabled || disabled" :class="inputClassName"
                          v-model="getCheckboxModel(option.value).value"/>
                <Label :for="optionId(option)">{{ option.label }}</Label>
            </div>
        </div>
        <template v-if="name">
            <input v-for="value in selectedValues" :key="`hidden-${value}`" type="hidden" :name="`${name}[]`"
                   :value="value"/>
        </template>
    </BaseField>
</template>
