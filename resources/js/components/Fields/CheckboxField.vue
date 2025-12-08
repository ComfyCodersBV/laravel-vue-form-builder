<script setup lang="ts">
import BaseField from './BaseField.vue'
import type { Field } from '../../types/form-builder'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { computed } from 'vue'
import { toBoolean } from '@/lib/utils'

type Props = Omit<Field, 'modelValue'> & {
  modelValue?: boolean
  value?: string | number | boolean
  falseValue?: string | number | boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  readonly: false,
})

const emit = defineEmits<{ 'update:modelValue': [boolean] }>()

const model = computed<boolean>({
  get: () => {
    const mv = props.modelValue as any
    const has = !(mv === undefined || mv === null || (typeof mv === 'string' && mv.length === 0))
    if (has) return !!mv
    return toBoolean((props as any).default)
  },
  set: (value) => emit('update:modelValue', !!value),
})
</script>

<template>
  <BaseField :label="label" :name="name" :error="error" :help="help">
    <div class="flex items-center gap-2">
      <input type="hidden" :name="name" :value="String(falseValue)" />
      <Checkbox
        :id="`${name}-cb`"
        :name="name"
        :value="String(value)"
        :disabled="disabled"
        :default-value="model"
      />
      <Label v-if="label" :for="`${name}-cb`">{{ label }}</Label>
    </div>
  </BaseField>
</template>
