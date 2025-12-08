<script setup lang="ts">
import BaseField from './BaseField.vue'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { Field } from '../../types/form-builder'
import { computed } from 'vue'

interface Option { value: string | number; label: string; disabled?: boolean }

type Options = Record<string, string> | Array<Option> | Array<string | number>

type Props = Omit<Field, 'modelValue'> & {
  modelValue?: Array<string | number>
  options?: Options
  inline?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  options: () => ({} as Options),
  inline: false,
})

const emit = defineEmits<{ 'update:modelValue': [Array<string | number>] }>()

const optionsList = computed<Option[]>(() => {
  const o = props.options
  if (Array.isArray(o)) {
    return (o as Array<Option | string | number>).map((item) =>
      typeof item === 'string' || typeof item === 'number'
        ? { value: item, label: String(item) }
        : item
    )
  }
  const rec: Record<string, string> = o ?? {}
  return Object.entries(rec).map(([value, label]) => ({ value, label }))
})

const selected = computed<Array<string | number>>({
  get: () => (Array.isArray(props.modelValue) ? props.modelValue : []),
  set: (arr) => emit('update:modelValue', arr),
})

function toggle(val: string | number, checked: boolean) {
  const current = new Set(selected.value.map(String))
  const key = String(val)

  if (checked) {
      current.add(key)
  } else {
      current.delete(key)
  }

  selected.value = Array.from(current)
}

const selectedSet = computed(() => new Set(selected.value.map(String)))

function isChecked(value: string | number) {
  return selectedSet.value.has(String(value))
}

const selectedValues = computed(() => selected.value.map((v) => String(v)))
</script>

<template>
  <BaseField :label="label" :name="name" :error="error" :help="help">
    <div :class="inline ? 'flex flex-wrap items-center gap-4' : 'grid gap-2'">
      <div v-for="option in optionsList" :key="String(option.value)" :class="inline ? 'inline-flex items-center gap-2' : 'flex items-center gap-2'">
        <Checkbox
          :checked="isChecked(option.value)"
          :id="`${name}-${String(option.value)}`"
          :name="`${name}[]`"
          :value="String(option.value)"
          :disabled="option.disabled || disabled"
          @update:checked="(c:any)=> toggle(option.value, !!c)"
        />
        <Label :for="`${name}-${String(option.value)}`">{{ option.label }}</Label>
      </div>
    </div>
    <template v-if="name">
      <input
        v-for="value in selectedValues"
        :key="`hidden-${value}`"
        type="hidden"
        :name="`${name}[]`"
        :value="value"
      />
    </template>
  </BaseField>
</template>
