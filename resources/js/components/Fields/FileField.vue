<script setup lang="ts">
import BaseField from './BaseField.vue'
import { Input } from '../ui/input'
import type { Field } from '../../types/form-builder'
import { computed } from 'vue'
import { cn } from '../../lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { Info } from 'lucide-vue-next'

interface FileFieldProps extends Field {
    prepend?: string
    append?: string
    tooltip?: string
    multiple?: boolean
    accept?: Array<string>
}

const props = withDefaults(defineProps<FileFieldProps>(), {
    className: undefined,
    disabled: false,
    error: undefined,
    label: undefined,
    modelValue: '',
    name: undefined,
    placeholder: undefined,
    readonly: false,
    type: 'file',
    prepend: undefined,
    append: undefined,
    tooltip: undefined,
    multiple: false,
    accept: undefined,
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

function getName() {
    if (props.multiple && ! props.name.endsWith("[]")) {
        return props.name + "[]"
    }

    return props.name
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
                :name="getName()"
                :disabled="disabled"
                :placeholder="placeholder"
                :readonly="readonly"
                :type="type"
                :accept="accept"
                :multiple="multiple"
                v-model="model"
                :class="cn('flex-1', leftRoundClass(), rightRoundClass())"
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
