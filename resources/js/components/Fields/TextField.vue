<script setup lang="ts">
import BaseField from './BaseField.vue'
import { Input } from '../ui/input'
import type { Field } from '../../types/form-builder'
import { computed } from 'vue'
import { cn } from '../../lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { Info } from 'lucide-vue-next'

interface TextFieldProps extends Field {
    append?: string
    autocomplete?: string
    maxlength?: number
    minlength?: number
    prepend?: string
    tooltip?: string
}

const props = withDefaults(defineProps<TextFieldProps>(), {
    append: undefined,
    autocomplete: undefined,
    className: undefined,
    disabled: false,
    error: undefined,
    label: undefined,
    maxlength: undefined,
    minlength: undefined,
    modelValue: '',
    name: undefined,
    placeholder: undefined,
    prepend: undefined,
    readonly: false,
    tooltip: undefined,
    type: 'text',
})

const emit = defineEmits<{ 'update:modelValue': [string | number] }>()

const model = computed<string | number>({
  get: () => (props.modelValue as any) ?? '',
  set: (v) => emit('update:modelValue', v as any),
})

const hasPrepend = computed(() => !!props.prepend)
const hasAppend = computed(() => !!props.append)
const hasTooltip = computed(() => !!props.tooltip)
const hasRight = computed(() => hasAppend.value || hasTooltip.value)

function rightRoundClass() {
  return hasRight.value ? 'rounded-r-none border-r-0' : ''
}
function leftRoundClass() {
  return hasPrepend.value ? 'rounded-l-none border-l-0' : ''
}
</script>

<template>
  <BaseField v-bind="{ label, name, error, className, help }">
    <div class="flex w-full">
      <span
        v-if="prepend"
        class="inline-flex items-center rounded-l-md border border-input bg-muted px-3 text-sm text-muted-foreground"
      >
        {{ prepend }}
      </span>

      <Input
        :id="name"
        :name="name"
        :disabled="disabled"
        :maxlength="maxlength"
        :minlength="minlength"
        :placeholder="placeholder"
        :readonly="readonly"
        :autocomplete="autocomplete"
        :type="type"
        v-model="model"
        :class="cn('flex-1 dark:text-neutral-100', leftRoundClass(), rightRoundClass())"
      />

      <span
        v-if="append"
        :class="cn('inline-flex items-center border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground', tooltip ? 'rounded-r-none' : 'rounded-r-md')"
      >
        {{ append }}
      </span>

      <Tooltip v-if="tooltip">
        <TooltipTrigger as-child>
          <button
            type="button"
            :class="cn('inline-flex items-center border border-l-0 border-input bg-muted px-2 text-muted-foreground', append ? '' : 'rounded-r-md')"
          >
            <Info class="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {{ tooltip }}
        </TooltipContent>
      </Tooltip>
    </div>
  </BaseField>
</template>
