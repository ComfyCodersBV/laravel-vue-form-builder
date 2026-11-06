<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from '@lucide/vue'
import { Button } from '../button/index'
import TouchPickerSurface from './TouchPickerSurface.vue'
import TouchTimeChoices from './TouchTimeChoices.vue'
import { useFormMessages } from '../../../lib/messages'
import { padTime as pad, useAnchoredPicker } from '../../../lib/touch-picker'
import { resolveTimezone, toDisplayWallClock, toZonedIso, wallClockAt, wallClockOfDate, type WallClock } from '../../../lib/timezone'
import type { DisabledDate } from '../../../lib/dates'
import { formatDateValue, isDisabledDay, isSameDay, monthGrid, parseDateValue, weekdayLabels, type DateValueContext } from '../../../lib/date-value'

interface Props {
  id?: string
  modelValue?: string | null
  placeholder?: string
  enableTime?: boolean
  format?: string
  minDate?: string
  maxDate?: string
  weekStartsOn?: number
  locale?: string
  disabled?: boolean
  readonly?: boolean
  timezone?: string
  serverTimezone?: string
  disabledWeekdays?: number[]
  disabledDates?: DisabledDate[]
  minuteStep?: number
  hourFrom?: number
  hourTo?: number
  label?: string
  clearable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  id: undefined,
  modelValue: null,
  placeholder: undefined,
  enableTime: false,
  format: 'locale',
  minDate: undefined,
  maxDate: undefined,
  weekStartsOn: 0,
  locale: undefined,
  disabled: false,
  readonly: false,
  timezone: undefined,
  serverTimezone: undefined,
  disabledWeekdays: () => [],
  disabledDates: () => [],
  minuteStep: 15,
  hourFrom: 0,
  hourTo: 23,
  label: undefined,
  clearable: false,
})

const emit = defineEmits<{ 'update:modelValue': [string | null] }>()

const messageContext = useFormMessages()
const messages = computed(() => messageContext.value.messages)
const calendarLocale = computed(() => props.locale ?? messageContext.value.locale)
const zone = computed(() => props.enableTime ? resolveTimezone(props.timezone) : null)
const context = computed((): DateValueContext => ({
  zone: zone.value,
  serverTimezone: props.serverTimezone,
  format: props.format,
  locale: calendarLocale.value,
}))
const anchored = useAnchoredPicker()
const isLocked = computed(() => props.disabled || props.readonly)
const canClear = computed(() => props.clearable && !isLocked.value && day.value !== null)

const day = ref<Date | null>(null)
const hour = ref<number | null>(null)
const minute = ref<number | null>(null)
const lastEmitted = ref<string | null | undefined>(undefined)

function today(): Date {
  const now = new Date()

  if (!zone.value) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }

  const wall = wallClockAt(now, zone.value)

  return new Date(wall.year, wall.month - 1, wall.day)
}

const initial = today()
const viewYear = ref(initial.getFullYear())
const viewMonth = ref(initial.getMonth())

const dateOpen = ref(false)
const timeOpen = ref(false)

function showMonthOf(date: Date): void {
  viewYear.value = date.getFullYear()
  viewMonth.value = date.getMonth()
}

function wallOf(value: string | null): WallClock | null {
  if (!value) {
    return null
  }

  if (props.enableTime && zone.value) {
    return toDisplayWallClock(value, zone.value, props.serverTimezone)
  }

  const parsed = parseDateValue(value, props.enableTime, context.value)

  return parsed ? wallClockOfDate(parsed) : null
}

watch(() => props.modelValue, (value) => {
  if (value === lastEmitted.value) {
    return
  }

  const wall = wallOf(value ?? null)

  day.value = wall ? new Date(wall.year, wall.month - 1, wall.day) : null
  hour.value = wall && props.enableTime ? wall.hour : null
  minute.value = wall && props.enableTime ? wall.minute : null

  showMonthOf(day.value ?? today())
}, { immediate: true })

function composedValue(): string {
  if (!day.value) {
    return ''
  }

  const wall: WallClock = {
    year: day.value.getFullYear(),
    month: day.value.getMonth() + 1,
    day: day.value.getDate(),
    hour: hour.value ?? 0,
    minute: minute.value ?? 0,
  }
  const date = `${wall.year}-${pad(wall.month)}-${pad(wall.day)}`

  if (!props.enableTime) {
    return date
  }

  if (zone.value) {
    return toZonedIso(wall, zone.value)
  }

  return `${date} ${pad(wall.hour)}:${pad(wall.minute)}`
}

function publish(): void {
  const value = composedValue()

  lastEmitted.value = value

  if (value === (props.modelValue ?? '')) {
    return
  }

  emit('update:modelValue', value)
}

const weeks = computed(() => monthGrid(viewYear.value, viewMonth.value, props.weekStartsOn ?? 0))
const weekdays = computed(() => weekdayLabels(calendarLocale.value, props.weekStartsOn ?? 0))
const monthLabel = computed(() => new Date(viewYear.value, viewMonth.value, 1).toLocaleString(calendarLocale.value, { month: 'long', year: 'numeric' }))

const dateLabel = computed(() => day.value
  ? day.value.toLocaleDateString(calendarLocale.value, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
  : '')

const timeLabel = computed(() => hour.value === null ? '' : `${pad(hour.value)}:${pad(minute.value ?? 0)}`)

function withCurrent(values: number[], current: number | null): number[] {
  if (current === null || values.includes(current)) {
    return values
  }

  return [...values, current].sort((first, second) => first - second)
}

const hourOptions = computed(() => {
  const from = Math.max(0, Math.min(props.hourFrom ?? 0, 23))
  const to = Math.max(from, Math.min(props.hourTo ?? 23, 23))

  return withCurrent(Array.from({ length: to - from + 1 }, (_, i) => from + i), hour.value)
})

const minuteOptions = computed(() => {
  const step = Math.max(1, Math.min(props.minuteStep ?? 15, 60))

  return withCurrent(Array.from({ length: Math.ceil(60 / step) }, (_, i) => i * step), minute.value)
})

function isDisabled(date: Date): boolean {
  return isDisabledDay(date, props, props.enableTime, context.value)
}

function previousMonth(): void {
  showMonthOf(new Date(viewYear.value, viewMonth.value - 1, 1))
}

function nextMonth(): void {
  showMonthOf(new Date(viewYear.value, viewMonth.value + 1, 1))
}

function pickDay(date: Date): void {
  if (isDisabled(date)) {
    return
  }

  const needsTime = props.enableTime && hour.value === null

  day.value = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (needsTime) {
    hour.value = hourOptions.value[0] ?? 0
    minute.value = 0
  }

  dateOpen.value = false
  publish()

  if (needsTime) {
    timeOpen.value = true
  }
}

function pickToday(): void {
  const current = today()

  showMonthOf(current)
  pickDay(current)
}

function clear(): void {
  day.value = null
  hour.value = null
  minute.value = null
  dateOpen.value = false
  timeOpen.value = false
  publish()
}

function longDate(date: Date): string {
  return date.toLocaleDateString(calendarLocale.value, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function pickHour(value: number): void {
  hour.value = value
  minute.value ??= 0
  publish()
}

function pickMinute(value: number): void {
  minute.value = value
  hour.value ??= hourOptions.value[0] ?? 0
  publish()
}

const dayClass = computed(() => anchored.value ? 'h-9 text-sm' : 'h-12 text-lg')
const actionClass = computed(() => anchored.value ? 'h-9 text-sm' : 'h-12 text-base')
const navClass = computed(() => anchored.value ? 'size-9' : 'size-12')
const navIconClass = computed(() => anchored.value ? 'size-4' : 'size-6')
const triggerIconClass = computed(() => anchored.value ? 'size-4' : 'size-5')

defineOptions({ inheritAttrs: false })
</script>

<template>
  <div class="flex w-full gap-2" data-touch-picker>
    <TouchPickerSurface v-model:open="dateOpen" :anchored="anchored" :description="messages.pickDate" data-touch-calendar>
      <template #trigger>
        <Button
          v-bind="$attrs"
          :id="props.id"
          variant="outline"
          type="button"
          :class="['min-w-0 flex-1 justify-start text-left font-normal', actionClass]"
          :disabled="isLocked"
          aria-haspopup="dialog"
          data-touch-date
        >
          <CalendarIcon :class="['shrink-0', triggerIconClass]" />
          <span v-if="day" class="truncate">{{ dateLabel }}</span>
          <span v-else class="truncate text-muted-foreground">{{ props.placeholder ?? messages.pickDate }}</span>
        </Button>
      </template>

      <template #title>{{ props.label ?? messages.pickDate }}</template>

      <div class="flex items-center justify-between">
        <Button variant="outline" type="button" :class="navClass" :aria-label="messages.previousMonth" @click="previousMonth">
          <ChevronLeft :class="navIconClass" />
        </Button>
        <div class="font-semibold capitalize" :class="anchored ? 'text-sm' : 'text-lg'">{{ monthLabel }}</div>
        <Button variant="outline" type="button" :class="navClass" :aria-label="messages.nextMonth" @click="nextMonth">
          <ChevronRight :class="navIconClass" />
        </Button>
      </div>

      <div class="grid grid-cols-7 gap-1 text-center font-medium text-muted-foreground" :class="anchored ? 'text-xs' : 'text-sm'">
        <span v-for="weekday in weekdays" :key="weekday">{{ weekday }}</span>
      </div>

      <div class="grid grid-cols-7 gap-1">
        <template v-for="(row, i) in weeks" :key="`row-${i}`">
          <button
            v-for="cell in row"
            :key="cell.date.toISOString()"
            type="button"
            class="flex w-full items-center justify-center rounded-lg tabular-nums transition-colors"
            :disabled="isDisabled(cell.date)"
            :data-date="formatDateValue(cell.date, false, null)"
            :aria-current="isSameDay(today(), cell.date) ? 'date' : undefined"
            :aria-label="longDate(cell.date)"
            :aria-pressed="isSameDay(day, cell.date)"
            :class="[
              dayClass,
              cell.inMonth ? 'text-foreground' : 'text-muted-foreground/60',
              isSameDay(today(), cell.date) ? 'font-bold ring-2 ring-primary ring-inset' : '',
              isSameDay(day, cell.date) ? 'bg-primary text-primary-foreground' : '',
              isDisabled(cell.date) ? 'cursor-not-allowed line-through opacity-40' : 'cursor-pointer hover:bg-accent',
            ]"
            @click="pickDay(cell.date)"
          >
            {{ cell.date.getDate() }}
          </button>
        </template>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <Button variant="outline" type="button" :class="actionClass" :disabled="isDisabled(today())" @click="pickToday">
          {{ messages.today }}
        </Button>
        <Button v-if="canClear" variant="outline" type="button" class="col-span-2 row-start-2" :class="actionClass" data-touch-clear @click="clear">
          {{ messages.clearAll }}
        </Button>
        <Button variant="secondary" type="button" :class="actionClass" @click="dateOpen = false">
          {{ messages.done }}
        </Button>
      </div>
    </TouchPickerSurface>

    <TouchPickerSurface v-if="props.enableTime" v-model:open="timeOpen" :anchored="anchored" :description="messages.pickTime" data-touch-clock>
      <template #trigger>
        <Button
          variant="outline"
          type="button"
          :class="['shrink-0 justify-start font-normal tabular-nums', actionClass, anchored ? 'w-24' : 'w-32']"
          :disabled="isLocked"
          :aria-label="`${messages.pickTime}${timeLabel ? `: ${timeLabel}` : ''}`"
          aria-haspopup="dialog"
          data-touch-time
        >
          <Clock :class="['shrink-0', triggerIconClass]" />
          <span v-if="timeLabel">{{ timeLabel }}</span>
          <span v-else class="text-muted-foreground">{{ messages.pickTime }}</span>
        </Button>
      </template>

      <template #title>
        {{ props.label ?? messages.pickTime }}<span v-if="timeLabel" class="ml-2 tabular-nums">{{ timeLabel }}</span>
      </template>

      <TouchTimeChoices
        :hours="hourOptions"
        :minutes="minuteOptions"
        :hour="hour"
        :minute="minute"
        :compact="anchored"
        @hour="pickHour"
        @minute="pickMinute"
      />

      <div class="grid gap-2" :class="canClear ? 'grid-cols-2' : 'grid-cols-1'">
        <Button v-if="canClear" variant="outline" type="button" :class="actionClass" data-touch-clear @click="clear">
          {{ messages.clearAll }}
        </Button>
        <Button type="button" :class="actionClass" @click="timeOpen = false">
          {{ messages.done }}
        </Button>
      </div>
    </TouchPickerSurface>
  </div>
</template>
