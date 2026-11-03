<script setup lang="ts">
import BaseField from './BaseField.vue'
import type { Field, FieldOption } from '../../types/form-builder'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { RadioGroupItem as RadioGroupTile } from 'reka-ui'
import { Label } from '../ui/label'
import { Link } from '@inertiajs/vue3'
import { computed, ref, watch } from 'vue'
import { isInternalHref, isSafeHref } from '../../lib/links'

type Options = Record<string, string> | Array<FieldOption> | Array<string | number>

interface Props extends Field {
  options?: Options
  inline?: boolean
  tiles?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  error: undefined,
  label: undefined,
  modelValue: '',
  options: () => ({} as Options),
  readonly: false,
  inline: false,
  tiles: false,
})

const emit = defineEmits<{ 'update:modelValue': [string | number] }>()

const optionsList = computed<FieldOption[]>(() => {
  const o = props.options
  if (Array.isArray(o)) {
    return (o as Array<FieldOption | string | number>).map((item) =>
      typeof item === 'string' || typeof item === 'number'
        ? { value: item, label: String(item) }
        : item
    )
  }
  const rec: Record<string, string> = o ?? {}
  return Object.entries(rec).map(([value, label]) => ({ value, label }))
})

const internalKey = ref<string>('')

watch(
  () => props.modelValue,
  (val) => {
    internalKey.value = val == null ? '' : String(val)
  },
  { immediate: true }
)

function onUpdateInternal(key: unknown) {
  internalKey.value = String(key ?? '')
  const found = optionsList.value.find((opt) => String(opt.value) === internalKey.value)
  emit('update:modelValue', found ? found.value : internalKey.value)
}

function linkOf(option: FieldOption): string | null {
  return option.linkLabel && isSafeHref(option.href) ? option.href.trim() : null
}

function targetOf(option: FieldOption): string | undefined {
  const target = option.target?.trim()

  return target && target !== '_self' ? target : undefined
}

function navigatesInPlace(option: FieldOption): boolean {
  return !targetOf(option) && isInternalHref(linkOf(option)!)
}

function descriptionOf(option: FieldOption): string | undefined {
  return option.description ?? option.help
}

const TILE_COLUMNS: Record<number, string> = {
  1: '',
  2: 'sm:grid-cols-2',
}

const groupClass = computed(() => {
  if (props.tiles) {
    return ['grid grid-cols-1 gap-3', TILE_COLUMNS[optionsList.value.length] ?? 'sm:grid-cols-3']
  }

  return props.inline ? 'flex flex-wrap items-center gap-4' : 'grid gap-2'
})

function optionId(option: FieldOption): string {
  return `${props.name}-${String(option.value)}`
}

function isSelected(option: FieldOption): boolean {
  return internalKey.value === String(option.value)
}

function isDisabled(option: FieldOption): boolean {
  return Boolean(option.disabled || props.disabled || props.readonly)
}

function tileClass(option: FieldOption): string[] {
  return [
    'relative flex min-h-16 items-center gap-3 rounded-lg border-2 p-4 text-left transition-colors',
    isSelected(option) ? 'border-primary bg-primary/10' : 'border-input bg-background',
    isDisabled(option) ? 'cursor-not-allowed opacity-50' : 'hover:border-primary',
  ]
}
</script>

<template>
  <BaseField :label="props.label" :name="props.name" :error="props.error" :help="props.help" :class-name="props.className" :theme="props.theme">
    <RadioGroup
      :model-value="internalKey"
      :disabled="props.disabled || props.readonly"
      @update:model-value="onUpdateInternal"
      :class="groupClass"
      :aria-label="props.label || undefined"
      :data-tiles="props.tiles ? '' : undefined"
    >
      <input type="hidden" :name="props.name" value="" />
      <template v-if="props.tiles">
        <div
          v-for="opt in optionsList"
          :key="String(opt.value)"
          :class="tileClass(opt)"
          :data-option="String(opt.value)"
          :data-selected="isSelected(opt) ? '' : undefined"
        >
          <RadioGroupTile
            :id="optionId(opt)"
            :value="String(opt.value)"
            :disabled="opt.disabled"
            :aria-labelledby="`${optionId(opt)}-label`"
            :aria-describedby="descriptionOf(opt) ? `${optionId(opt)}-description` : undefined"
            class="absolute inset-0 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed"
            :class="isDisabled(opt) ? '' : 'cursor-pointer'"
            data-option-tile
          />
          <span
            class="flex size-5 shrink-0 items-center justify-center rounded-full border-2"
            :class="isSelected(opt) ? 'border-primary' : 'border-input'"
            aria-hidden="true"
          >
            <span v-if="isSelected(opt)" class="size-2.5 rounded-full bg-primary" />
          </span>
          <span class="flex min-w-0 flex-col gap-1">
            <span :id="`${optionId(opt)}-label`" class="text-base font-semibold leading-snug">{{ opt.label }}</span>
            <span
              v-if="descriptionOf(opt)"
              :id="`${optionId(opt)}-description`"
              class="text-sm text-muted-foreground"
            >{{ descriptionOf(opt) }}</span>
            <template v-if="linkOf(opt)">
              <Link
                v-if="navigatesInPlace(opt)"
                :href="linkOf(opt)!"
                class="relative z-10 self-start text-xs text-primary underline underline-offset-2"
                data-option-link
              >{{ opt.linkLabel }}</Link>
              <a
                v-else
                :href="linkOf(opt)!"
                :target="targetOf(opt)"
                rel="noopener noreferrer"
                class="relative z-10 self-start text-xs text-primary underline underline-offset-2"
                data-option-link
              >{{ opt.linkLabel }}</a>
            </template>
          </span>
        </div>
      </template>
      <template v-else>
        <div
          v-for="opt in optionsList"
          :key="String(opt.value)"
          :class="props.inline ? 'inline-flex items-center gap-2' : 'flex items-start gap-2'"
          :data-option="String(opt.value)"
        >
          <RadioGroupItem :id="`${props.name}-${String(opt.value)}`" :value="String(opt.value)" :disabled="opt.disabled" />
          <div class="flex flex-col">
            <div class="flex flex-wrap items-center gap-2">
              <Label :for="`${props.name}-${String(opt.value)}`">{{ opt.label }}</Label>
              <template v-if="linkOf(opt)">
                <Link
                  v-if="navigatesInPlace(opt)"
                  :href="linkOf(opt)!"
                  class="text-xs text-primary underline underline-offset-2"
                  data-option-link
                >{{ opt.linkLabel }}</Link>
                <a
                  v-else
                  :href="linkOf(opt)!"
                  :target="targetOf(opt)"
                  rel="noopener noreferrer"
                  class="text-xs text-primary underline underline-offset-2"
                  data-option-link
                >{{ opt.linkLabel }}</a>
              </template>
            </div>
            <p v-if="descriptionOf(opt)" class="text-xs text-muted-foreground">{{ descriptionOf(opt) }}</p>
          </div>
        </div>
      </template>
    </RadioGroup>
    <input v-if="props.name && internalKey" type="hidden" :name="props.name" :value="internalKey" />
  </BaseField>
</template>
