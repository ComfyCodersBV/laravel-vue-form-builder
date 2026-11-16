<script setup lang="ts">
import { computed } from 'vue'
import { useFieldId } from '../../lib/field-id'
import BaseField from './BaseField.vue'
import { useDescribedBy } from '../../lib/described-by'
import { useFieldListeners } from '../../lib/listeners'
import { Textarea } from '../ui/textarea'
import type { Field } from '../../types/form-builder'
import { cn } from '../../lib/utils'

interface Props extends Field {
    name: string
    modelValue?: string
    rows?: number
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()

const model = computed({
    get: () => props.modelValue ?? '',
    set: v => emit('update:modelValue', v),
})

defineOptions({ inheritAttrs: false })

const { listeners, wrapperAttrs } = useFieldListeners()

const describedBy = useDescribedBy(() => ({
    name: props.name,
    help: props.help,
    helpText: props.helpText,
    error: props.error,
    extra: [listeners()['aria-describedby']],
}))

const inputId = useFieldId(() => props.name)
</script>

<template>
    <BaseField v-bind="{ ...wrapperAttrs(), label, name, error, className, help, theme }">
        <Textarea
            v-bind="listeners()"
            :aria-describedby="describedBy"
            :id="inputId"
            :name="name"
            v-model="model"
            :placeholder="placeholder"
            :disabled="disabled"
            :readonly="readonly"
            :rows="rows"
            :class="cn(rows ? 'min-h-0' : '', inputClassName)"
        />
    </BaseField>
</template>
