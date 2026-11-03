<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from '@lucide/vue'
import { Button } from '../button/index'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../dialog/index'
import { useFormMessages } from '../../../lib/messages'
import { resolveTimezone } from '../../../lib/timezone'
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
const isLocked = computed(() => props.disabled || props.readonly)

const day = ref<Date | null>(null)
const hour = ref<number | null>(null)
const minute = ref<number | null>(null)
const lastEmitted = ref<string | null | undefined>(undefined)

const today = new Date()
const viewYear = ref(today.getFullYear())
const viewMonth = ref(today.getMonth())

const dateOpen = ref(false)
const timeOpen = ref(false)

function showMonthOf(date: Date): void {
  viewYear.value = date.getFullYear()
  viewMonth.value = date.getMonth()
}

watch(() => props.modelValue, (value) => {
  if (value === lastEmitted.value) {
    return
  }

  const parsed = parseDateValue(value ?? null, props.enableTime, context.value)

  day.value = parsed
  hour.value = parsed && props.enableTime ? parsed.getHours() : null
  minute.value = parsed && props.enableTime ? parsed.getMinutes() : null

  showMonthOf(parsed ?? today)
}, { immediate: true })

function composed(): Date | null {
  if (!day.value) {
    return null
  }

  const result = new Date(day.value.getFullYear(), day.value.getMonth(), day.value.getDate())

  if (!props.enableTime) {
    return result
  }

  if (hour.value === null) {
    return null
  }

  result.setHours(hour.value, minute.value ?? 0)

  return result
}

function publish(): void {
  const value = formatDateValue(composed(), props.enableTime, zone.value) ?? ''

  if (value === (props.modelValue ?? '')) {
    lastEmitted.value = value
    return
  }

  lastEmitted.value = value
  emit('update:modelValue', value)
}

const weeks = computed(() => monthGrid(viewYear.value, viewMonth.value, props.weekStartsOn ?? 0))
const weekdays = computed(() => weekdayLabels(calendarLocale.value, props.weekStartsOn ?? 0))
const monthLabel = computed(() => new Date(viewYear.value, viewMonth.value, 1).toLocaleString(calendarLocale.value, { month: 'long', year: 'numeric' }))

const dateLabel = computed(() => day.value
  ? day.value.toLocaleDateString(calendarLocale.value, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
  : '')

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value)
}

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

  day.value = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  dateOpen.value = false
  publish()

  if (props.enableTime && hour.value === null) {
    timeOpen.value = true
  }
}

function pickToday(): void {
  showMonthOf(today)
  pickDay(today)
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

const dialogClass = 'top-auto bottom-0 max-h-[92dvh] translate-y-0 gap-3 overflow-y-auto rounded-t-2xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))] data-[state=closed]:slide-out-to-top-[100%] data-[state=open]:slide-in-from-top-[100%] sm:top-1/2 sm:bottom-auto sm:max-w-md sm:-translate-y-1/2 sm:rounded-lg dark:text-neutral-100'
const choiceClass = 'flex h-12 w-full cursor-pointer items-center justify-center rounded-lg border text-base tabular-nums transition-colors'
</script>

<template>
  <div class="flex w-full gap-2" data-touch-picker>
    <Button
      :id="props.id"
      variant="outline"
      type="button"
      class="h-12 min-w-0 flex-1 justify-start text-left text-base font-normal"
      :disabled="isLocked"
      data-touch-date
      @click="dateOpen = true"
    >
      <CalendarIcon class="size-5 shrink-0" />
      <span v-if="day" class="truncate">{{ dateLabel }}</span>
      <span v-else class="truncate text-muted-foreground">{{ props.placeholder ?? messages.pickDate }}</span>
    </Button>

    <Button
      v-if="props.enableTime"
      variant="outline"
      type="button"
      class="h-12 w-32 shrink-0 justify-start text-base font-normal tabular-nums"
      :disabled="isLocked"
      :aria-label="`${messages.pickTime}${timeLabel ? `: ${timeLabel}` : ''}`"
      data-touch-time
      @click="timeOpen = true"
    >
      <Clock class="size-5 shrink-0" />
      <span v-if="timeLabel">{{ timeLabel }}</span>
      <span v-else class="text-muted-foreground">{{ messages.pickTime }}</span>
    </Button>

    <Dialog v-model:open="dateOpen">
      <DialogContent :class="dialogClass" data-touch-calendar>
        <DialogTitle class="text-lg">{{ props.label ?? messages.pickDate }}</DialogTitle>
        <DialogDescription class="sr-only">{{ messages.pickDate }}</DialogDescription>

        <div class="flex items-center justify-between">
          <Button variant="outline" type="button" class="size-12" :aria-label="messages.previousMonth" @click="previousMonth">
            <ChevronLeft class="size-6" />
          </Button>
          <div class="text-lg font-semibold capitalize">{{ monthLabel }}</div>
          <Button variant="outline" type="button" class="size-12" :aria-label="messages.nextMonth" @click="nextMonth">
            <ChevronRight class="size-6" />
          </Button>
        </div>

        <div class="grid grid-cols-7 gap-1 text-center text-sm font-medium text-muted-foreground">
          <span v-for="weekday in weekdays" :key="weekday">{{ weekday }}</span>
        </div>

        <div class="grid grid-cols-7 gap-1">
          <template v-for="(row, i) in weeks" :key="`row-${i}`">
            <button
              v-for="cell in row"
              :key="cell.date.toISOString()"
              type="button"
              class="flex h-12 w-full items-center justify-center rounded-lg text-lg tabular-nums transition-colors"
              :disabled="isDisabled(cell.date)"
              :data-date="formatDateValue(cell.date, false, null)"
              :aria-current="isSameDay(today, cell.date) ? 'date' : undefined"
              :aria-pressed="isSameDay(day, cell.date)"
              :class="[
                cell.inMonth ? 'text-foreground' : 'text-muted-foreground/60',
                isSameDay(today, cell.date) ? 'font-bold ring-2 ring-primary ring-inset' : '',
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
          <Button variant="outline" type="button" class="h-12 text-base" :disabled="isDisabled(today)" @click="pickToday">
            {{ messages.today }}
          </Button>
          <Button variant="secondary" type="button" class="h-12 text-base" @click="dateOpen = false">
            {{ messages.done }}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog v-if="props.enableTime" v-model:open="timeOpen">
      <DialogContent :class="dialogClass" data-touch-clock>
        <DialogTitle class="text-lg">
          {{ props.label ?? messages.pickTime }}<span v-if="timeLabel" class="ml-2 tabular-nums">{{ timeLabel }}</span>
        </DialogTitle>
        <DialogDescription class="sr-only">{{ messages.pickTime }}</DialogDescription>

        <div class="text-sm font-medium text-muted-foreground">{{ messages.hour }}</div>
        <div class="grid grid-cols-4 gap-2 sm:grid-cols-6">
          <button
            v-for="option in hourOptions"
            :key="`h-${option}`"
            type="button"
            :class="[choiceClass, option === hour ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent']"
            :aria-pressed="option === hour"
            :data-hour="option"
            @click="pickHour(option)"
          >
            {{ pad(option) }}
          </button>
        </div>

        <div class="text-sm font-medium text-muted-foreground">{{ messages.minutes }}</div>
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="option in minuteOptions"
            :key="`m-${option}`"
            type="button"
            :class="[choiceClass, option === minute ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent']"
            :aria-pressed="option === minute"
            :data-minute="option"
            @click="pickMinute(option)"
          >
            :{{ pad(option) }}
          </button>
        </div>

        <Button type="button" class="h-12 text-base" @click="timeOpen = false">
          {{ messages.done }}
        </Button>
      </DialogContent>
    </Dialog>
  </div>
</template>
