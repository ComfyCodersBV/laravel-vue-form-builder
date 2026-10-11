<script setup lang="ts">
import BaseField from './BaseField.vue'
import type { Field } from '../../types/form-builder'
import { DatePicker } from '../ui/date-picker'
import { ref, watch, computed } from 'vue'

interface DateFieldProps extends Field {
  enableTime?: boolean
  range?: boolean
  minDate?: string
  maxDate?: string
  weekStartsOn?: number
  timezone?: string
  serverTimezone?: string
}

const props = withDefaults(defineProps<DateFieldProps>(), {
  enableTime: false,
  range: false,
  minDate: undefined,
  maxDate: undefined,
  weekStartsOn: 0,
  disabled: false,
  readonly: false,
  timezone: undefined,
  serverTimezone: undefined,
})

const emit = defineEmits<{ 'update:modelValue': [any] }>()

const internal = ref<any>(props.modelValue ?? (props.range ? { start: null, end: null } : ''))

watch(() => props.modelValue, (v) => { internal.value = v }, { immediate: true })
watch(internal, (v) => emit('update:modelValue', v))

const singleValue = computed(() => typeof internal.value === 'string' ? internal.value : '')
const rangeStart = computed(() => (internal.value?.start ?? ''))
const rangeEnd = computed(() => (internal.value?.end ?? ''))
</script>

<template>
  <BaseField :label="props.label" :name="props.name" :error="props.error" :help="props.help" :class-name="(props as any).className" :theme="props.theme">
    <DatePicker
      v-model="internal"
      :enable-time="props.enableTime"
      :placeholder="props.placeholder || undefined"
      :range="props.range"
      :min-date="props.minDate"
      :max-date="props.maxDate"
      :week-starts-on="props.weekStartsOn"
      :format="props.format || 'locale'"
      :locale="props.locale"
      :disabled="!!props.disabled"
      :readonly="!!props.readonly"
      :timezone="props.timezone"
      :server-timezone="props.serverTimezone"
    />

    <template v-if="props.name && !props.range">
      <input type="hidden" :name="props.name" :value="singleValue" />
    </template>
    <template v-else-if="props.name && props.range">
      <input type="hidden" :name="`${props.name}[start]`" :value="rangeStart" />
      <input type="hidden" :name="`${props.name}[end]`" :value="rangeEnd" />
    </template>
  </BaseField>
</template>