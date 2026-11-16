<script setup lang="ts">
import { computed } from 'vue'
import BaseField from './BaseField.vue'
import { useDescribedBy } from '../../lib/described-by'
import { useFieldId } from '../../lib/field-id'
import { useFieldMeta } from '../../lib/field-meta'
import type { InputSlotProps } from '../../lib/field-slots'
import type { Field } from '../../types/form-builder'

const props = defineProps<{
    field: Field
    form: any
    error?: string | string[]
    modelValue?: any
}>()

const emit = defineEmits<{ 'update:modelValue': [any] }>()

const inputId = useFieldId(() => props.field.name)

const meta = useFieldMeta(() => ({}))

const columnDescription = computed((): unknown => (props.field as Record<string, unknown>)['aria-describedby'])

const describedBy = useDescribedBy(() => ({
    name: props.field.name,
    help: props.field.help,
    helpText: props.field.helpText,
    error: props.error,
    extra: [columnDescription.value],
}))

function update(value: any): void {
    emit('update:modelValue', value)
}

const slotProps = computed((): InputSlotProps => ({
    id: inputId.value,
    name: props.field.name,
    describedby: describedBy.value,
    invalid: Boolean(props.error),
    required: meta.value.markRequired,
    disabled: Boolean(props.field.disabled),
    readonly: Boolean(props.field.readonly),
    field: props.field,
    form: props.form,
    error: props.error,
    modelValue: props.modelValue,
    update,
    'onUpdate:modelValue': update,
}))
</script>

<template>
    <BaseField
        :label="field.label"
        :name="field.name"
        :error="error"
        :help="field.help"
        :class-name="field.wrapperClassName ?? field.className"
        :theme="field.theme"
        :hide-label="field.hideLabel"
        data-input-slot
    >
        <slot v-bind="slotProps" />
    </BaseField>
</template>
