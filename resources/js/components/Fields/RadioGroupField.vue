<script setup lang="ts">
import BaseField from './BaseField.vue'
import type { Field } from '../../types/form-builder'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Label } from '../ui/label'
import { computed, ref, watch } from 'vue'

interface Option { value: string | number; label: string; help?: string; disabled?: boolean }

type Options = Record<string, string> | Array<Option> | Array<string | number>

interface Props extends Field {
  options?: Options
  inline?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  error: undefined,
  label: undefined,
  modelValue: '',
  options: () => ({} as Options),
  readonly: false,
  inline: false,
})

const emit = defineEmits<{ 'update:modelValue': [string | number] }>()

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

// Internal string key for RadioGroup
const internalKey = ref<string>('')

watch(
  () => props.modelValue,
  (val) => {
    internalKey.value = val == null ? '' : String(val)
  },
  { immediate: true }
)

function onUpdateInternal(key: string) {
  internalKey.value = key
  const found = optionsList.value.find((opt) => String(opt.value) === key)
  emit('update:modelValue', (found ? found.value : key) as any)
}
</script>

<template>
  <BaseField :label="props.label" :name="props.name" :error="props.error" :help="props.help">
    <RadioGroup
      v-model="internalKey"
      :disabled="props.disabled || props.readonly"
      @update:model-value="onUpdateInternal"
      :class="props.inline ? 'flex flex-wrap items-center gap-4' : 'grid gap-2'"
    >
      <input type="hidden" :name="props.name" value="" />
      <div
        v-for="opt in optionsList"
        :key="String(opt.value)"
        :class="props.inline ? 'inline-flex items-center gap-2' : 'flex items-start gap-2'"
      >
        <RadioGroupItem :id="`${props.name}-${String(opt.value)}`" :value="String(opt.value)" :disabled="opt.disabled" />
        <div class="flex flex-col">
          <Label :for="`${props.name}-${String(opt.value)}`">{{ opt.label }}</Label>
          <p v-if="opt.help" class="text-xs text-muted-foreground">{{ opt.help }}</p>
        </div>
      </div>
    </RadioGroup>
    <input v-if="props.name && internalKey" type="hidden" :name="props.name" :value="internalKey" />
  </BaseField>
</template>
