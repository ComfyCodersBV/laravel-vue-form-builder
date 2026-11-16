<script setup lang="ts">
import BaseField from './BaseField.vue'
import type { Field } from '../../types/form-builder'
import { computed, inject } from 'vue'
import { useFieldId } from '../../lib/field-id'
import { formFieldsKey } from '../../lib/fields'
import { conditionData, expressionValue, formValues } from '../../lib/conditions'
import { cn } from '../../lib/utils'

interface DisplayProps extends Field {
    content?: string
    expression?: string
    form?: any
}

const props = withDefaults(defineProps<DisplayProps>(), {
    className: undefined,
    content: undefined,
    expression: undefined,
    form: undefined,
    label: undefined,
    name: undefined,
})

defineOptions({ inheritAttrs: false })

const formFields = inject(formFieldsKey, [])

const text = computed(() => {
    if (props.expression && props.form) {
        return expressionValue(props.expression, conditionData(formValues(props.form), formFields))
    }

    return props.content ?? ''
})

const inputId = useFieldId(() => props.name)
</script>

<template>
    <BaseField :label="label" :name="name" :error="error" :help="help" :class-name="className" :theme="theme">
        <output
            :id="inputId"
            :class="cn('flex min-h-9 w-full items-center text-sm break-words dark:text-neutral-100', inputClassName)"
            aria-live="polite"
            data-display
        >{{ text }}</output>
    </BaseField>
</template>
