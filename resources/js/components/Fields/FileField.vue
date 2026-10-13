<script setup lang="ts">
import BaseField from './BaseField.vue'
import { Input } from '../ui/input'
import type { CurrentFile, Field } from '../../types/form-builder'
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
    removeRequested?: boolean | string | number | string[]
    currentFiles?: CurrentFile[]
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
    currentFiles: undefined,
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

const listsFiles = computed(() => Array.isArray(props.currentFiles) && props.currentFiles.length > 0)

const removedKeys = computed<string[]>(() => Array.isArray(props.removeRequested) ? props.removeRequested.map(String) : [])

function isRemovingFile(file: CurrentFile): boolean {
    return removedKeys.value.includes(file.key)
}

function toggleFileRemoval(file: CurrentFile, event: Event) {
    if (!props.removeFlag) {
        return
    }

    const others = removedKeys.value.filter((key) => key !== file.key)

    emit('update:formValue', props.removeFlag, (event.target as HTMLInputElement).checked ? [...others, file.key] : others)
}

const SIZE_UNITS = ['B', 'KB', 'MB', 'GB']

function formatSize(size: number): string {
    const exponent = Math.min(Math.floor(Math.log(Math.max(size, 1)) / Math.log(1024)), SIZE_UNITS.length - 1)
    const value = size / 1024 ** exponent

    return `${new Intl.NumberFormat(messageContext.value.locale, { maximumFractionDigits: exponent === 0 ? 0 : 1 }).format(value)} ${SIZE_UNITS[exponent]}`
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
      <div v-if="listsFiles" class="mb-2 space-y-1 text-sm" data-current-files>
          <div class="text-xs text-muted-foreground">{{ messageContext.messages.currentFiles }}</div>
          <ul class="divide-y rounded-md border border-input">
              <li
                  v-for="file in currentFiles"
                  :key="file.key"
                  class="flex items-center gap-3 px-3 py-2"
                  data-current-file-item
                  :data-removing="isRemovingFile(file) ? '' : undefined"
              >
                  <div class="min-w-0 flex-1">
                      <a
                          v-if="file.url"
                          :href="file.url"
                          target="_blank"
                          rel="noopener"
                          :class="cn('block truncate underline underline-offset-2', isRemovingFile(file) ? 'text-muted-foreground line-through' : '')"
                      >
                          {{ file.name || file.url }}
                      </a>
                      <span v-else :class="cn('block truncate', isRemovingFile(file) ? 'text-muted-foreground line-through' : '')">{{ file.name }}</span>
                  </div>
                  <span v-if="typeof file.size === 'number'" class="shrink-0 text-xs text-muted-foreground">{{ formatSize(file.size) }}</span>
                  <label v-if="removeFlag" class="inline-flex shrink-0 cursor-pointer items-center gap-2 text-xs">
                      <input
                          type="checkbox"
                          class="size-4"
                          :checked="isRemovingFile(file)"
                          :disabled="!!disabled || !!readonly"
                          :aria-label="`${messageContext.messages.remove} ${file.name}`"
                          @change="toggleFileRemoval(file, $event)"
                      />
                      {{ messageContext.messages.remove }}
                  </label>
              </li>
          </ul>
          <template v-if="removeFlag">
              <input v-for="key in removedKeys" :key="key" type="hidden" :name="`${removeFlag}[]`" :value="key" />
          </template>
      </div>

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
