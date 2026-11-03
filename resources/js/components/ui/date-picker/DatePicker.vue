<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Button } from '../button/index'
import { Popover, PopoverContent, PopoverTrigger } from '../popover/index'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from '@lucide/vue'
import { useFormMessages } from '../../../lib/messages'
import { resolveTimezone } from '../../../lib/timezone'
import type { DisabledDate } from '../../../lib/dates'
import { formatDate, formatHasTime } from '../../../lib/date-format'
import { formatDateValue, isDisabledDay, isSameDay, monthGrid, parseDateValue, weekdayLabels as labelsOfWeek, type DateValueContext } from '../../../lib/date-value'

interface Props {
  id?: string
  modelValue?: any // string|null for single; { start: string|null, end: string|null } for range
  placeholder?: string
  enableTime?: boolean
  format?: string // 'locale' | Day.js pattern like 'YYYY-MM-DD', 'ddd D MMM YYYY' or 'DD/MM/YYYY h:mm A'
  range?: boolean
  minDate?: string
  maxDate?: string
  weekStartsOn?: number // 0=Sun, 1=Mon
  locale?: string
  disabled?: boolean
  readonly?: boolean
  timezone?: string
  serverTimezone?: string
  disabledWeekdays?: number[]
  disabledDates?: DisabledDate[]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  placeholder: undefined,
  enableTime: false,
  format: 'locale', // default to localized display
  range: false,
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
})

const messageContext = useFormMessages()
const messages = computed(() => messageContext.value.messages)
const calendarLocale = computed(() => props.locale ?? messageContext.value.locale)
const zone = computed(() => props.enableTime ? resolveTimezone(props.timezone) : null)

const weekdayLabels = computed(() => labelsOfWeek(calendarLocale.value, props.weekStartsOn ?? 0))

const monthLabel = computed(() => new Date(viewYear.value, viewMonth.value, 1).toLocaleString(calendarLocale.value, { month: 'long', year: 'numeric' }))

const emit = defineEmits<{ 'update:modelValue': [any] }>()

function pad(n: number) { return n < 10 ? `0${n}` : String(n) }
const valueContext = computed((): DateValueContext => ({
  zone: zone.value,
  serverTimezone: props.serverTimezone,
  format: props.format,
  locale: calendarLocale.value,
}))
function formatISO(d: Date | null, withTime: boolean) {
  return formatDateValue(d, withTime, zone.value)
}
// Display formatting (props.format)
function formatDisplay(d: Date | null, fmt: string, withTime: boolean, locale?: string) {
  if (!d) return ''
  if (fmt === 'locale') {
    const opt: Intl.DateTimeFormatOptions = withTime
      ? { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }
      : { year: 'numeric', month: '2-digit', day: '2-digit' }
    return d.toLocaleString(locale, opt)
  }
  const out = formatDate(d, fmt, calendarLocale.value)
  if (withTime && !formatHasTime(fmt)) return `${out} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  return out
}
function parseDate(s: string | null, withTime: boolean): Date | null {
  return parseDateValue(s, withTime, valueContext.value)
}

const open = ref(false)
// single
const selected = ref<Date | null>(props.range ? null : parseDate(props.modelValue as string | null, props.enableTime))
// range
const selectedStart = ref<Date | null>(props.range ? parseDate((props.modelValue?.start ?? null), props.enableTime) : null)
const selectedEnd = ref<Date | null>(props.range ? parseDate((props.modelValue?.end ?? null), props.enableTime) : null)

const initialAnchor = selected.value || selectedStart.value || new Date()
const viewMonth = ref<number>(initialAnchor ? initialAnchor.getMonth() : new Date().getMonth())
const viewYear = ref<number>(initialAnchor ? initialAnchor.getFullYear() : new Date().getFullYear())

watch(() => props.modelValue, (v) => {
  if (!props.range) {
    selected.value = parseDate(v as string | null, props.enableTime)
    if (selected.value) {
      viewMonth.value = selected.value.getMonth()
      viewYear.value = selected.value.getFullYear()
    }
  } else {
    selectedStart.value = parseDate((v?.start ?? null), props.enableTime)
    selectedEnd.value = parseDate((v?.end ?? null), props.enableTime)
    const anchor = selectedStart.value || selectedEnd.value
    if (anchor) {
      viewMonth.value = anchor.getMonth()
      viewYear.value = anchor.getFullYear()
    }
  }
})

watch(() => props.enableTime, () => {
  if (!props.range) {
    selected.value = parseDate(props.modelValue as string | null, props.enableTime)
  } else {
    selectedStart.value = parseDate((props.modelValue?.start ?? null), props.enableTime)
    selectedEnd.value = parseDate((props.modelValue?.end ?? null), props.enableTime)
  }
})

function setSelected(d: Date) {
  if (isDisabled(d)) return
  if (!props.range) {
    if (props.enableTime && selected.value) {
      d.setHours(selected.value.getHours(), selected.value.getMinutes())
    }
    selected.value = d
    emit('update:modelValue', formatISO(selected.value, props.enableTime))
    return
  }
  // range selection
  if (!selectedStart.value || (selectedStart.value && selectedEnd.value)) {
    // start new range
    selectedStart.value = d
    selectedEnd.value = null
  } else if (selectedStart.value && !selectedEnd.value) {
    if (d < selectedStart.value) {
      selectedEnd.value = selectedStart.value
      selectedStart.value = d
    } else {
      selectedEnd.value = d
    }
  }
  emit('update:modelValue', {
    start: formatISO(selectedStart.value, props.enableTime),
    end: formatISO(selectedEnd.value, props.enableTime),
  })
}

function prevMonth() {
  if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value -= 1 } else { viewMonth.value -= 1 }
}
function nextMonth() {
  if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value += 1 } else { viewMonth.value += 1 }
}

const weeks = computed(() => monthGrid(viewYear.value, viewMonth.value, props.weekStartsOn ?? 0))

function isBetween(d: Date, a: Date | null, b: Date | null) {
  if (!a || !b) return false
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const ta = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime()
  const tb = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime()
  return t >= Math.min(ta, tb) && t <= Math.max(ta, tb)
}

function isDisabled(d: Date) {
  return isDisabledDay(d, props, props.enableTime, valueContext.value)
}

const hours = computed({
  get: () => selected.value ? selected.value.getHours() : 0,
  set: (h: number) => {
    if (!selected.value) selected.value = new Date(viewYear.value, viewMonth.value, 1)
    selected.value.setHours(h)
    emit('update:modelValue', formatISO(selected.value, props.enableTime))
  }
})
const minutes = computed({
  get: () => selected.value ? selected.value.getMinutes() : 0,
  set: (m: number) => {
    if (!selected.value) selected.value = new Date(viewYear.value, viewMonth.value, 1)
    selected.value.setMinutes(m)
      emit('update:modelValue', formatISO(selected.value, props.enableTime))
  }
})
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button :id="props.id" variant="outline" type="button" class="w-full justify-start text-left font-normal" :disabled="props.disabled || props.readonly">
        <CalendarIcon class="mr-2 h-4 w-4" />
        <template v-if="!props.range">
          <span v-if="selected">{{ formatDisplay(selected, props.format, props.enableTime, props.locale) }}</span>
          <span v-else class="text-muted-foreground">{{ props.placeholder ?? messages.pickDate }}</span>
        </template>
        <template v-else>
          <span v-if="selectedStart || selectedEnd">
            {{ selectedStart ? formatDisplay(selectedStart, props.format, props.enableTime, props.locale) : '…' }}
            –
            {{ selectedEnd ? formatDisplay(selectedEnd, props.format, props.enableTime, props.locale) : '…' }}
          </span>
          <span v-else class="text-muted-foreground">{{ props.placeholder ?? messages.pickPeriod }}</span>
        </template>
      </Button>
    </PopoverTrigger>
    <PopoverContent align="start" class="w-auto p-3">
      <div class="flex items-center justify-between mb-2">
      <Button variant="ghost" size="icon" @click="prevMonth" :aria-label="messages.previousMonth"><ChevronLeft class="w-4 h-4" /></Button>
        <div class="text-sm font-medium">{{ monthLabel }}</div>
        <Button variant="ghost" size="icon" @click="nextMonth" :aria-label="messages.nextMonth"><ChevronRight class="w-4 h-4" /></Button>
      </div>
      <div class="flex gap-2 mb-2">
        <Button variant="outline" size="sm" :disabled="isDisabled(new Date())" @click="() => setSelected(new Date())">{{ messages.today }}</Button>
        <Button v-if="props.range" variant="outline" size="sm" @click="() => { const e=new Date(); const s=new Date(); s.setDate(e.getDate()-6); selectedStart=s; selectedEnd=e; emit('update:modelValue', { start: formatISO(s, props.enableTime), end: formatISO(e, props.enableTime) }) }">{{ messages.lastSevenDays }}</Button>
        <Button v-if="props.range" variant="outline" size="sm" @click="() => { const a=new Date(viewYear, viewMonth, 1); const b=new Date(viewYear, viewMonth+1, 0); selectedStart=a; selectedEnd=b; emit('update:modelValue', { start: formatISO(a, props.enableTime), end: formatISO(b, props.enableTime) }) }">{{ messages.thisMonth }}</Button>
      </div>
      <div class="grid grid-cols-7 gap-1 text-xs text-muted-foreground mb-1">
        <span v-for="label in weekdayLabels" :key="label" class="text-center">{{ label }}</span>
      </div>
      <div class="grid grid-cols-7 gap-1">
        <template v-for="(row, i) in weeks" :key="'r-'+i">
          <template v-for="cell in row" :key="cell.date.toISOString()">
            <button
              type="button"
              class="h-8 w-8 rounded text-sm flex items-center justify-center transition-colors"
              :disabled="isDisabled(cell.date)"
              :data-date="formatISO(cell.date, false)"
              :class="[
                cell.inMonth ? 'text-foreground' : 'text-muted-foreground/50',
                (!props.range && isSameDay(selected, cell.date)) ? 'bg-primary text-primary-foreground' : '',
                (props.range && isBetween(cell.date, selectedStart, selectedEnd)) ? 'bg-accent text-foreground' : '',
                (props.range && isSameDay(selectedStart, cell.date)) ? 'bg-primary text-primary-foreground' : '',
                (props.range && isSameDay(selectedEnd, cell.date)) ? 'bg-primary text-primary-foreground' : '',
                (!isDisabled(cell.date)) ? 'hover:bg-accent' : 'opacity-50 cursor-not-allowed line-through'
              ]"
              @click="setSelected(new Date(cell.date))"
            >
              {{ cell.date.getDate() }}
            </button>
          </template>
        </template>
      </div>
      <div v-if="props.enableTime && !props.range" class="mt-3 flex items-center gap-2">
        <Clock class="w-4 h-4 text-muted-foreground" />
        <input
          type="number"
          min="0"
          max="23"
          :aria-label="messages.hours"
          class="w-14 rounded border border-input bg-transparent px-2 py-1 text-sm"
          :value="hours"
          @input="hours = Number(($event.target as HTMLInputElement).value)"
        />
        :
        <input
          type="number"
          min="0"
          max="59"
          :aria-label="messages.minutes"
          class="w-14 rounded border border-input bg-transparent px-2 py-1 text-sm"
          :value="minutes"
          @input="minutes = Number(($event.target as HTMLInputElement).value)"
        />
      </div>
      <div v-if="props.enableTime && props.range" class="mt-3 grid grid-cols-2 gap-3 items-center">
        <div class="flex items-center gap-2">
          <Clock class="w-4 h-4 text-muted-foreground" />
          <input
            type="number"
            min="0"
            max="23"
          :aria-label="messages.hours"
            class="w-14 rounded border border-input bg-transparent px-2 py-1 text-sm"
            :value="selectedStart ? selectedStart.getHours() : 0"
            @input="($event: Event) => {
                if (!selectedStart) selectedStart = new Date(viewYear, viewMonth, 1) as any;
                (selectedStart as Date).setHours(Number(($event.target as HTMLInputElement).value));
                emit('update:modelValue', { start: formatISO(selectedStart, true), end: formatISO(selectedEnd, true) })
            }"
          />
          :
          <input
            type="number"
            min="0"
            max="59"
          :aria-label="messages.minutes"
            class="w-14 rounded border border-input bg-transparent px-2 py-1 text-sm"
            :value="selectedStart ? selectedStart.getMinutes() : 0"
            @input="($event: Event) => {
                if (!selectedStart) selectedStart = new Date(viewYear, viewMonth, 1) as any;
                (selectedStart as Date).setMinutes(Number(($event.target as HTMLInputElement).value));
                emit('update:modelValue', { start: formatISO(selectedStart, true), end: formatISO(selectedEnd, true) })
            }"
          />
        </div>
        <div class="flex items-center gap-2">
          <Clock class="w-4 h-4 text-muted-foreground" />
          <input
            type="number"
            min="0"
            max="23"
          :aria-label="messages.hours"
            class="w-14 rounded border border-input bg-transparent px-2 py-1 text-sm"
            :value="selectedEnd ? selectedEnd.getHours() : 0"
            @input="($event: Event) => {
                if (!selectedEnd) selectedEnd = new Date(viewYear, viewMonth, 1) as any;
                (selectedEnd as Date).setHours(Number(($event.target as HTMLInputElement).value));
                emit('update:modelValue', { start: formatISO(selectedStart, true), end: formatISO(selectedEnd, true) })
            }"
          />
          :
          <input
            type="number"
            min="0"
            max="59"
          :aria-label="messages.minutes"
            class="w-14 rounded border border-input bg-transparent px-2 py-1 text-sm"
            :value="selectedEnd ? selectedEnd.getMinutes() : 0"
            @input="($event: Event) => {
                if (!selectedEnd) selectedEnd = new Date(viewYear, viewMonth, 1) as any;
                (selectedEnd as Date).setMinutes(Number(($event.target as HTMLInputElement).value));
                emit('update:modelValue', { start: formatISO(selectedStart, true), end: formatISO(selectedEnd, true) })
            }"
          />
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
