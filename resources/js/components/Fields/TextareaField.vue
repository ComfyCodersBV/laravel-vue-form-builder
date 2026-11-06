<script setup lang="ts">
import { computed } from 'vue'
import BaseField from './BaseField.vue'
import { useFieldListeners } from '../../lib/listeners'
import { Textarea } from '../ui/textarea'
import type { Field } from '../../types/form-builder'

interface Props extends Field {
    name: string
    modelValue?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()

const model = computed({
    get: () => props.modelValue ?? '',
    set: v => emit('update:modelValue', v),
})

defineOptions({ inheritAttrs: false })

const { listeners, wrapperAttrs } = useFieldListeners()
</script>

<template>
    <BaseField v-bind="{ ...wrapperAttrs(), label, name, error, className, help, theme }">
        <Textarea
            v-bind="listeners()"
            :id="name"
            :name="name"
            v-model="model"
            :placeholder="placeholder"
            :disabled="disabled"
            :readonly="readonly"
            :class="inputClassName"
        />
    </BaseField>
</template>
