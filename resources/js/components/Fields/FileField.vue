<script setup lang="ts">
import BaseField from './BaseField.vue'
import { Input } from '../ui/input'
import type { Field } from '../../types/form-builder'
import { computed, ref, watch } from 'vue'
import { cn } from '../../lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { Info } from '@lucide/vue'
import { useFormMessages } from '../../lib/messages'

interface FileFieldProps extends Field {
    prepend?: string
    append?: string
    tooltip?: string
    multiple?: boolean
    accept?: Array<string>
    currentUrl?: string
    currentName?: string
    preview?: boolean
    removeFlag?: string
    removeRequested?: boolean | string | number
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
    currentUrl: undefined,
    currentName: undefined,
    preview: true,
    removeFlag: undefined,
    removeRequested: false,
})

const emit = defineEmits<{
    'update:modelValue': [File | File[] | string]
    'update:formValue': [string, any]
}>()

const messageContext = useFormMessages()

const control = ref<HTMLElement | null>(null)

watch(() => props.modelValue, (value) => {
    if (value !== '' && value !== null && !(Array.isArray(value) && value.length === 0)) {
        return
    }

    const input = control.value?.querySelector<HTMLInputElement>('input[type="file"]')

    if (input) {
        input.value = ''
    }
})

const IMAGE_PATTERN = /\.(avif|bmp|gif|jpe?g|png|svg|webp)$/i

const showsImage = computed(() => {
    if (!props.preview || !props.currentUrl) {
        return false
    }

    if (props.currentUrl.startsWith('data:image/')) {
        return true
    }

    return IMAGE_PATTERN.test(props.currentUrl.split(/[?#]/)[0])
})

const isRemoving = computed(() => [true, 1, '1', 'true'].includes(props.removeRequested as any))

function toggleRemoval(event: Event) {
    if (!props.removeFlag) {
        return
    }

    emit('update:formValue', props.removeFlag, (event.target as HTMLInputElement).checked)
}

function handleChange(event: Event) {
    const input = event.target as HTMLInputElement
    if (!input.files || input.files.length === 0) {
        emit('update:modelValue', '')
        return
    }
    emit('update:modelValue', props.multiple ? Array.from(input.files) : input.files[0])
}

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
    if (props.multiple && props.name && ! props.name.endsWith("[]")) {
        return props.name + "[]"
    }

    return props.name
}
</script>

<template>
    <BaseField v-bind="{ label, name, error, className, help, theme }">
      <div ref="control" class="flex w-full">
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
                @change="handleChange"
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

        <div v-if="currentUrl" class="mt-2 flex items-center gap-3 text-sm" data-current-file>
            <a v-if="showsImage" :href="currentUrl" target="_blank" rel="noopener" class="shrink-0">
                <img
                    :src="currentUrl"
                    :alt="currentName ?? ''"
                    :class="cn('size-16 rounded-md border border-input object-cover', isRemoving ? 'opacity-40' : '')"
                />
            </a>
            <div class="min-w-0 flex-1 space-y-1">
                <div class="text-xs text-muted-foreground">{{ messageContext.messages.currentFile }}</div>
                <a
                    :href="currentUrl"
                    target="_blank"
                    rel="noopener"
                    :class="cn('block truncate underline underline-offset-2', isRemoving ? 'text-muted-foreground line-through' : '')"
                >
                    {{ currentName || currentUrl }}
                </a>
                <label v-if="removeFlag" class="inline-flex cursor-pointer items-center gap-2 text-xs">
                    <input
                        type="checkbox"
                        class="size-4"
                        :checked="isRemoving"
                        :disabled="!!disabled || !!readonly"
                        @change="toggleRemoval"
                    />
                    {{ messageContext.messages.removeCurrentFile }}
                </label>
            </div>
            <input v-if="removeFlag" type="hidden" :name="removeFlag" :value="isRemoving ? '1' : '0'" />
        </div>
    </BaseField>
</template>
