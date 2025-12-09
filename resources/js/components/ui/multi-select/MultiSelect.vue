<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Popover, PopoverContent, PopoverTrigger } from '../popover'
import { Button } from '../button'
import { Input } from '../input'
import { X, ChevronsUpDown } from 'lucide-vue-next'
import { cn } from '../../../lib/utils'

export interface Option { value: string | number; label: string }

interface Props {
  modelValue?: Array<string | number>
  options: Option[]
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  options: () => [],
  placeholder: 'Select...',
  disabled: false,
  readonly: false,
})

const emit = defineEmits<{ 'update:modelValue': [Array<string | number>] }>()

const open = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const contentWidth = ref<string>('auto')

onMounted(() => {
  if (triggerRef.value) contentWidth.value = `${triggerRef.value.getBoundingClientRect().width}px`
})

watch(open, (o) => {
  if (o && triggerRef.value) contentWidth.value = `${triggerRef.value.getBoundingClientRect().width}px`
})

const query = ref('')
const selected = computed<Array<string | number>>({
  get: () => (Array.isArray(props.modelValue) ? props.modelValue : []),
  set: (arr) => emit('update:modelValue', arr),
})
const selectedSet = computed(() => new Set(selected.value.map(String)))

const filtered = computed(() => {
  if (!query.value) return props.options
  const q = query.value.toLowerCase()
  return props.options.filter(o => o.label.toLowerCase().includes(q) || String(o.value).toLowerCase().includes(q))
})

function toggleValue(val: string | number) {
  if (props.disabled || props.readonly) return
  const set = new Set(selected.value.map(String))
  const key = String(val)
  if (set.has(key)) set.delete(key); else set.add(key)
  selected.value = Array.from(set)
}

function remove(val: string | number) {
  const set = new Set(selected.value.map(String))
  set.delete(String(val))
  selected.value = Array.from(set)
}

function clearAll() {
  selected.value = []
}

function labelFor(val: string | number) {
  return props.options.find(o => String(o.value) === String(val))?.label ?? String(val)
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <button
        ref="triggerRef"
        type="button"
        :disabled="props.disabled"
        :class="cn('flex min-h-10 w-full cursor-default flex-wrap items-center gap-1 rounded-md border border-input bg-background px-3 py-1 text-left text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50')"
      >
        <template v-if="selected.length">
          <span
            v-for="val in selected"
            :key="`chip-${String(val)}`"
            class="inline-flex items-center gap-1 rounded-full border border-input bg-muted px-2 py-0.5 text-xs"
          >
            {{ labelFor(val) }}
            <button
              type="button"
              class="ml-1 rounded hover:bg-accent/70"
              @click.stop="remove(val)"
              aria-label="Remove"
              :disabled="props.disabled || props.readonly"
            >
              <X class="h-3.5 w-3.5" />
            </button>
          </span>
        </template>
        <span v-else class="text-muted-foreground">{{ props.placeholder }}</span>
        <ChevronsUpDown class="ml-auto h-4 w-4 opacity-50" />
      </button>
    </PopoverTrigger>
    <PopoverContent align="start" :style="{ width: contentWidth }" class="p-2">
      <div class="flex items-center gap-2 pb-2 border-b">
        <Input v-model="query" placeholder="Zoeken..." class="h-8" />
        <Button type="button" variant="outline" size="sm" @click="clearAll" :disabled="!selected.length">Clear</Button>
      </div>
      <div class="max-h-64 overflow-auto pt-2">
        <button
          v-for="opt in filtered"
          :key="String(opt.value)"
          type="button"
          class="flex w-full items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-accent"
          :class="selectedSet.has(String(opt.value)) ? 'bg-accent' : ''"
          @click="toggleValue(opt.value)"
          :disabled="props.disabled || props.readonly"
        >
          <span class="truncate mr-2">{{ opt.label }}</span>
          <span v-if="selectedSet.has(String(opt.value))" class="text-muted-foreground text-xs">Geselecteerd</span>
        </button>
        <div v-if="!filtered.length" class="px-2 py-3 text-xs text-muted-foreground">Geen resultaten</div>
      </div>
    </PopoverContent>
  </Popover>
</template>
