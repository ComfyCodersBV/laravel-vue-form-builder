<script setup lang="ts">
import BaseField from './BaseField.vue'
import type { Field } from '../../types/form-builder'
import { DatePicker, TouchDatePicker } from '../ui/date-picker'
import { ref, watch, computed } from 'vue'
import type { DisabledDate } from '../../lib/dates'

interface DateFieldProps extends Field {
  enableTime?: boolean
  range?: boolean
  minDate?: string
  maxDate?: string
  weekStartsOn?: number
  timezone?: string
  serverTimezone?: string
  disabledWeekdays?: number[]
  disabledDates?: DisabledDate[]
  touch?: boolean
  minuteStep?: number
  hourFrom?: number
  hourTo?: number
  clearable?: boolean
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
  disabledWeekdays: () => [],
  disabledDates: () => [],
  touch: false,
  minuteStep: 15,
  hourFrom: 0,
  hourTo: 23,
  clearable: false,
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
    <TouchDatePicker
      v-if="props.touch && !props.range"
      :id="props.name"
      v-model="internal"
      :enable-time="props.enableTime"
      :placeholder="props.placeholder || undefined"
      :min-date="props.minDate"
      :max-date="props.maxDate"
      :week-starts-on="props.weekStartsOn"
      :format="props.format || 'locale'"
      :locale="props.locale"
      :disabled="!!props.disabled"
      :readonly="!!props.readonly"
      :timezone="props.timezone"
      :server-timezone="props.serverTimezone"
      :disabled-weekdays="props.disabledWeekdays"
      :disabled-dates="props.disabledDates"
      :minute-step="props.minuteStep"
      :hour-from="props.hourFrom"
      :hour-to="props.hourTo"
      :label="props.label"
      :clearable="props.clearable"
    />
    <DatePicker
      v-else
      :id="props.name"
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
      :disabled-weekdays="props.disabledWeekdays"
      :disabled-dates="props.disabledDates"
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