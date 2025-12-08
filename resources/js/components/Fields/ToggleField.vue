<script setup lang="ts">
import BaseField from './BaseField.vue'
import { Switch } from '@/components/ui/switch'
import type { Field } from '../../types/form-builder'
import { computed } from 'vue'
import { toBoolean } from '@/lib/utils'

type Props = Omit<Field, 'modelValue'> & {
  modelValue?: boolean
  value?: string | number | boolean
  falseValue?: string | number | boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

const emit = defineEmits<{ 'update:modelValue': [boolean] }>()

const model = computed<boolean>({
  get: () => {
    const mv = props.modelValue as any
    const has = !(mv === undefined || mv === null || (typeof mv === 'string' && mv.length === 0))
    if (has) {
        return !!mv
    }

    return toBoolean((props as any).default)
  },
  set: (value) => emit('update:modelValue', !!value),
})
</script>

<template>
  <BaseField :label="label" :name="name" :error="error" :help="help">
    <div class="flex items-center gap-2">
      <input type="hidden" :name="name" :value="String(falseValue)" />
      <Switch
        :default-value="model"
        :id="`${name}-tgl`"
        :name="name"
        :value="String(value)"
        :disabled="disabled"
      />
      <label v-if="label" class="text-sm" :for="`${name}-tgl`">{{ label }}</label>
    </div>
  </BaseField>
</template>
