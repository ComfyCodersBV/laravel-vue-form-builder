<script setup lang="ts">
import BaseField from './BaseField.vue'
import type { Field } from '../../types/form-builder'
import { DatePicker } from '@/components/ui/date-picker'
import { ref, watch, computed } from 'vue'

interface DateFieldProps extends Field {
  enableTime?: boolean
  range?: boolean
  minDate?: string
  maxDate?: string
  weekStartsOn?: number // 0=Sun, 1=Mon
}

const props = withDefaults(defineProps<DateFieldProps>(), {
  enableTime: false,
  range: false,
  minDate: undefined,
  maxDate: undefined,
  weekStartsOn: 0,
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
  <BaseField :label="props.label" :name="props.name" :error="props.error" :help="props.help">
    <DatePicker
      v-model="internal"
      :enable-time="props.enableTime"
      :placeholder="props.placeholder || (props.range ? 'Kies periode' : 'Kies datum')"
      :range="props.range"
      :min-date="props.minDate"
      :max-date="props.maxDate"
      :week-starts-on="props.weekStartsOn"
      :format="(props as any).format || 'locale'"
      :locale="(props as any).locale"
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
