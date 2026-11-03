<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Clock } from '@lucide/vue'
import { Button } from '../button/index'
import TouchPickerSurface from './TouchPickerSurface.vue'
import TouchTimeChoices from './TouchTimeChoices.vue'
import { useFormMessages } from '../../../lib/messages'
import { padTime, useAnchoredPicker } from '../../../lib/touch-picker'

interface Props {
  id?: string
  modelValue?: string | null
  placeholder?: string
  label?: string
  times?: string[]
  hourFrom?: number
  hourTo?: number
  minuteStep?: number
  disabledTimes?: string[]
  isDisabled?: (time: string) => boolean
  clearable?: boolean
  disabled?: boolean
  readonly?: boolean
}

type Time = { hour: number; minute: number }

const props = withDefaults(defineProps<Props>(), {
  id: undefined,
  modelValue: null,
  placeholder: undefined,
  label: undefined,
  times: undefined,
  hourFrom: 0,
  hourTo: 23,
  minuteStep: 15,
  disabledTimes: () => [],
  isDisabled: () => false,
  clearable: false,
  disabled: false,
  readonly: false,
})

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const messageContext = useFormMessages()
const messages = computed(() => messageContext.value.messages)
const anchored = useAnchoredPicker()
const open = ref(false)

function parse(value: string | null | undefined): Time | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(value ?? '')

  if (!match) {
    return null
  }

  return { hour: Number(match[1]), minute: Number(match[2]) }
}

function format(hour: number, minute: number): string {
  return `${padTime(hour)}:${padTime(minute)}`
}

function generatedTimes(): string[] {
  const from = Math.max(0, Math.min(props.hourFrom ?? 0, 23))
  const to = Math.max(from, Math.min(props.hourTo ?? 23, 23))
  const step = Math.max(1, Math.min(props.minuteStep ?? 15, 60))
  const times: string[] = []

  for (let hour = from; hour <= to; hour++) {
    for (let minute = 0; minute < 60; minute += step) {
      times.push(format(hour, minute))
    }
  }

  return times
}

const available = computed((): Time[] => (props.times ?? generatedTimes())
  .map(parse)
  .filter((time): time is Time => time !== null))

const availableKeys = computed(() => new Set(available.value.map((time) => format(time.hour, time.minute))))
const blockedKeys = computed(() => new Set(props.disabledTimes
  .map(parse)
  .filter((time): time is Time => time !== null)
  .map((time) => format(time.hour, time.minute))))

function unavailable(hour: number, minute: number): boolean {
  const key = format(hour, minute)

  return !availableKeys.value.has(key) || blockedKeys.value.has(key) || props.isDisabled(key)
}

function unique(values: number[]): number[] {
  return [...new Set(values)].sort((first, second) => first - second)
}

const hours = computed(() => unique(available.value.map((time) => time.hour)))
const minutes = computed(() => unique(available.value.map((time) => time.minute)))

const selected = computed(() => parse(props.modelValue))
const shownHour = ref<number | null>(null)

watch(selected, (time) => {
  shownHour.value = time?.hour ?? null
}, { immediate: true })

const shownMinute = computed(() => selected.value && selected.value.hour === shownHour.value ? selected.value.minute : null)
const isLocked = computed(() => props.disabled || props.readonly)
const canClear = computed(() => props.clearable && !isLocked.value && selected.value !== null)
const valueLabel = computed(() => selected.value ? format(selected.value.hour, selected.value.minute) : '')
const actionClass = computed(() => anchored.value ? 'h-9 text-sm' : 'h-12 text-base')

function hourDisabled(hour: number): boolean {
  return minutes.value.every((minute) => unavailable(hour, minute))
}

function minuteDisabled(minute: number): boolean {
  if (shownHour.value === null) {
    return hours.value.every((hour) => unavailable(hour, minute))
  }

  return unavailable(shownHour.value, minute)
}

function publish(value: string): void {
  if (value === (props.modelValue ?? '')) {
    return
  }

  emit('update:modelValue', value)
}

function pickHour(hour: number): void {
  shownHour.value = hour

  const keep = selected.value && !unavailable(hour, selected.value.minute) ? selected.value.minute : null
  const minute = keep ?? minutes.value.find((option) => !unavailable(hour, option))

  if (minute === undefined) {
    return
  }

  publish(format(hour, minute))
}

function pickMinute(minute: number): void {
  const hour = shownHour.value ?? hours.value.find((option) => !unavailable(option, minute))

  if (hour === undefined || unavailable(hour, minute)) {
    return
  }

  shownHour.value = hour
  publish(format(hour, minute))
}

function clear(): void {
  shownHour.value = null
  open.value = false
  publish('')
}
</script>

<template>
  <div class="flex w-full" data-touch-time-picker>
    <TouchPickerSurface v-model:open="open" :anchored="anchored" :description="messages.pickTime" data-touch-clock>
      <template #trigger>
        <Button
          :id="props.id"
          variant="outline"
          type="button"
          class="h-12 w-full justify-start text-base font-normal tabular-nums"
          :disabled="isLocked"
          :aria-label="`${valueLabel || (props.placeholder ?? messages.pickTime)}${props.label ? `, ${props.label}` : ''}`"
          aria-haspopup="dialog"
          data-touch-time
        >
          <Clock class="size-5 shrink-0" />
          <span v-if="valueLabel">{{ valueLabel }}</span>
          <span v-else class="text-muted-foreground">{{ props.placeholder ?? messages.pickTime }}</span>
        </Button>
      </template>

      <template #title>
        {{ props.label ?? messages.pickTime }}<span v-if="valueLabel" class="ml-2 tabular-nums">{{ valueLabel }}</span>
      </template>

      <TouchTimeChoices
        :hours="hours"
        :minutes="minutes"
        :hour="shownHour"
        :minute="shownMinute"
        :compact="anchored"
        :hour-disabled="hourDisabled"
        :minute-disabled="minuteDisabled"
        @hour="pickHour"
        @minute="pickMinute"
      />

      <div class="grid gap-2" :class="canClear ? 'grid-cols-2' : 'grid-cols-1'">
        <Button v-if="canClear" variant="outline" type="button" :class="actionClass" data-touch-clear @click="clear">
          {{ messages.clearAll }}
        </Button>
        <Button type="button" :class="actionClass" @click="open = false">
          {{ messages.done }}
        </Button>
      </div>
    </TouchPickerSurface>
  </div>
</template>
