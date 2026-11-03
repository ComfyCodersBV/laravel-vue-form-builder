<script setup lang="ts">
import { computed, useId } from 'vue'
import { useFormMessages } from '../../../lib/messages'
import { padTime } from '../../../lib/touch-picker'

const props = withDefaults(defineProps<{
  hours: number[]
  minutes: number[]
  hour: number | null
  minute: number | null
  compact?: boolean
  hourDisabled?: (hour: number) => boolean
  minuteDisabled?: (minute: number) => boolean
}>(), {
  compact: false,
  hourDisabled: () => false,
  minuteDisabled: () => false,
})

const emit = defineEmits<{
  hour: [number]
  minute: [number]
}>()

const hourHeadingId = useId()
const minuteHeadingId = useId()
const messageContext = useFormMessages()
const messages = computed(() => messageContext.value.messages)

const sizeClass = computed(() => props.compact ? 'h-9 text-sm' : 'h-12 text-base')
const minuteColumns = computed(() => props.minutes.length > 6 ? 2 : 1)
const minuteColumnClass = computed(() => {
  if (minuteColumns.value === 2) {
    return props.compact ? 'w-24' : 'w-32'
  }

  return props.compact ? 'w-12' : 'w-16'
})

function choiceClass(selected: boolean, unavailable: boolean): string[] {
  return [
    'flex w-full items-center justify-center rounded-lg border tabular-nums transition-colors',
    sizeClass.value,
    selected ? 'border-primary bg-primary text-primary-foreground' : '',
    unavailable ? 'cursor-not-allowed line-through opacity-40' : 'cursor-pointer',
    !selected && !unavailable ? 'hover:bg-accent' : '',
  ]
}
</script>

<template>
  <div class="flex flex-col gap-3 min-[360px]:flex-row" data-touch-time-choices>
    <div class="grid min-w-0 flex-1 content-start gap-2">
      <div :id="hourHeadingId" class="text-sm font-medium text-muted-foreground">{{ messages.hour }}</div>
      <div class="grid grid-cols-4 gap-2" role="group" :aria-labelledby="hourHeadingId">
        <button
          v-for="option in props.hours"
          :key="`h-${option}`"
          type="button"
          :class="choiceClass(option === props.hour, props.hourDisabled(option))"
          :disabled="props.hourDisabled(option)"
          :aria-pressed="option === props.hour"
          :data-hour="option"
          @click="emit('hour', option)"
        >
          {{ padTime(option) }}
        </button>
      </div>
    </div>

    <div class="h-px shrink-0 bg-border min-[360px]:h-auto min-[360px]:w-px" aria-hidden="true" />

    <div class="grid shrink-0 content-start gap-2" :class="minuteColumnClass">
      <div :id="minuteHeadingId" class="text-sm font-medium text-muted-foreground">{{ messages.minute }}</div>
      <div class="grid gap-2" role="group" :aria-labelledby="minuteHeadingId" :class="minuteColumns === 2 ? 'grid-cols-2' : 'grid-cols-1'">
        <button
          v-for="option in props.minutes"
          :key="`m-${option}`"
          type="button"
          :class="choiceClass(option === props.minute, props.minuteDisabled(option))"
          :disabled="props.minuteDisabled(option)"
          :aria-pressed="option === props.minute"
          :data-minute="option"
          @click="emit('minute', option)"
        >
          :{{ padTime(option) }}
        </button>
      </div>
    </div>
  </div>
</template>
