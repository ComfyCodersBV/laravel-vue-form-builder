<script setup lang="ts">
import BaseField from './BaseField.vue'
import type { Field, FieldOption } from '../../types/form-builder'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Label } from '../ui/label'
import { Link } from '@inertiajs/vue3'
import { computed, ref, watch } from 'vue'
import { isInternalHref, isSafeHref } from '../../lib/links'

type Options = Record<string, string> | Array<FieldOption> | Array<string | number>

interface Props extends Field {
  options?: Options
  inline?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  error: undefined,
  label: undefined,
  modelValue: '',
  options: () => ({} as Options),
  readonly: false,
  inline: false,
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

function descriptionOf(option: FieldOption): string | undefined {
  return option.description ?? option.help
}
</script>

<template>
  <BaseField :label="props.label" :name="props.name" :error="props.error" :help="props.help" :class-name="props.className" :theme="props.theme">
    <RadioGroup
      :model-value="internalKey"
      :disabled="props.disabled || props.readonly"
      @update:model-value="onUpdateInternal"
      :class="props.inline ? 'flex flex-wrap items-center gap-4' : 'grid gap-2'"
    >
      <input type="hidden" :name="props.name" value="" />
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
                v-if="isInternalHref(linkOf(opt)!)"
                :href="linkOf(opt)!"
                class="text-xs text-primary underline underline-offset-2"
                data-option-link
              >{{ opt.linkLabel }}</Link>
              <a
                v-else
                :href="linkOf(opt)!"
                rel="noopener noreferrer"
                class="text-xs text-primary underline underline-offset-2"
                data-option-link
              >{{ opt.linkLabel }}</a>
            </template>
          </div>
          <p v-if="descriptionOf(opt)" class="text-xs text-muted-foreground">{{ descriptionOf(opt) }}</p>
        </div>
      </div>
    </RadioGroup>
    <input v-if="props.name && internalKey" type="hidden" :name="props.name" :value="internalKey" />
  </BaseField>
</template>
