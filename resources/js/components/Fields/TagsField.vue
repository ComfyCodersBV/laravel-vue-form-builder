<script setup lang="ts">
import BaseField from './BaseField.vue'
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { X } from '@lucide/vue'
import {
    ComboboxAnchor,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxPortal,
    ComboboxRoot,
    ComboboxViewport,
    TagsInputInput,
    TagsInputItem,
    TagsInputItemDelete,
    TagsInputItemText,
    TagsInputRoot,
} from 'reka-ui'
import type { Field } from '../../types/form-builder'
import { cn } from '../../lib/utils'
import { useFormMessages } from '../../lib/messages'
import {
    TAG_SEPARATOR_PATTERN,
    addTags,
    isEmailAddress,
    isTagSuggestion,
    normalizeTags,
    showsSuggestionValue,
    splitTags,
    suggestionsRequestUrl,
    type TagSuggestion,
} from '../../lib/tags'

interface TagsFieldProps extends Field {
    emails?: boolean
    suggestionsUrl?: string
    max?: number
    entryErrors?: Record<string, string | string[]>
}

const props = withDefaults(defineProps<TagsFieldProps>(), {
    className: undefined,
    disabled: false,
    error: undefined,
    label: undefined,
    modelValue: () => [],
    name: undefined,
    placeholder: undefined,
    readonly: false,
    emails: false,
    suggestionsUrl: undefined,
    max: undefined,
    entryErrors: () => ({}),
})

const emit = defineEmits<{
    'update:modelValue': [string[]]
}>()

const SUGGESTION_DELAY = 250

const messageContext = useFormMessages()
const messages = computed(() => messageContext.value.messages)

const tags = computed<string[]>({
    get: () => normalizeTags(props.modelValue),
    set: (value) => emit('update:modelValue', addTags([], value, props.max)),
})

const query = ref('')
const wantsOpen = ref(false)
const suggestions = shallowRef<TagSuggestion[]>([])
const labels = ref<Record<string, string>>({})
const isLoading = ref(false)

let controller: AbortController | null = null

const isLocked = computed(() => Boolean(props.disabled) || Boolean(props.readonly))

const isFull = computed(() => Boolean(props.max) && tags.value.length >= (props.max ?? 0))

const openSuggestions = computed(() => suggestions.value.filter((suggestion) => !tags.value.includes(suggestion.value)))

const isOpen = computed(() => Boolean(props.suggestionsUrl) && wantsOpen.value && query.value.trim() !== '' && (openSuggestions.value.length > 0 || !isLoading.value))

const serverInvalid = computed(() => new Set(
    Object.keys(props.entryErrors).map((key) => tags.value[Number(key)]).filter((tag): tag is string => typeof tag === 'string'),
))

const fieldError = computed(() => {
    if (props.error) {
        return props.error
    }

    const entryMessages = Object.values(props.entryErrors).flat()

    return entryMessages.length > 0 ? [...new Set(entryMessages)].join(' ') : undefined
})

function isInvalid(tag: string): boolean {
    return serverInvalid.value.has(tag) || (props.emails && !isEmailAddress(tag))
}

function labelFor(tag: string): string {
    return labels.value[tag] ?? tag
}

function add(entries: string[]): void {
    if (isLocked.value || entries.length === 0) {
        return
    }

    tags.value = addTags(tags.value, entries, props.max)
}

function convertValue(value: string): string {
    return value.trim()
}

function handlePaste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text') ?? ''

    if (!TAG_SEPARATOR_PATTERN.test(text)) {
        return
    }

    event.preventDefault()
    add(splitTags(text))
    query.value = ''
}

function updateTags(value: Array<string | number | Record<string, unknown>>): void {
    tags.value = value.filter((entry): entry is string | number => typeof entry !== 'object').map(String)
    query.value = ''
}

function choose(suggestion: TagSuggestion): void {
    labels.value = { ...labels.value, [suggestion.value]: suggestion.label }
    add([suggestion.value])
    query.value = ''
    suggestions.value = []
}

async function fetchSuggestions(term: string): Promise<void> {
    if (!props.suggestionsUrl || term.trim() === '') {
        suggestions.value = []

        return
    }

    controller?.abort()
    controller = new AbortController()
    isLoading.value = true

    try {
        const response = await fetch(suggestionsRequestUrl(props.suggestionsUrl, term.trim()), {
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            signal: controller.signal,
        })

        if (!response.ok) {
            suggestions.value = []

            return
        }

        const payload: unknown = await response.json()

        suggestions.value = (Array.isArray(payload) ? payload : [])
            .filter(isTagSuggestion)
            .map((suggestion) => ({ value: String(suggestion.value), label: suggestion.label ?? String(suggestion.value) }))
    } catch (error) {
        if ((error as Error)?.name !== 'AbortError') {
            suggestions.value = []
        }
    } finally {
        isLoading.value = false
    }
}

const debouncedFetch = useDebounceFn(fetchSuggestions, SUGGESTION_DELAY)

watch(query, (term) => {
    if (!props.suggestionsUrl) {
        return
    }

    wantsOpen.value = term.trim() !== ''
    debouncedFetch(term)
})

onBeforeUnmount(() => controller?.abort())
</script>

<template>
    <BaseField v-bind="{ label, name, error: fieldError, className, help, theme }">
        <ComboboxRoot
            :model-value="tags"
            :open="isOpen"
            :disabled="isLocked"
            :ignore-filter="true"
            :reset-search-term-on-blur="false"
            :reset-search-term-on-select="false"
            multiple
            class="relative"
            @update:open="wantsOpen = $event"
        >
            <ComboboxAnchor as-child>
                <TagsInputRoot
                    :model-value="tags"
                    :delimiter="TAG_SEPARATOR_PATTERN"
                    :disabled="isLocked"
                    :max="max ?? 0"
                    :convert-value="convertValue"
                    add-on-blur
                    add-on-tab
                    data-tags-input
                    :class="cn(
                        'flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1 text-base shadow-xs transition-[color,box-shadow] md:text-sm dark:bg-background',
                        'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
                        fieldError ? 'border-destructive' : '',
                        isLocked ? 'cursor-not-allowed opacity-50' : '',
                    )"
                    @update:model-value="updateTags"
                >
                    <TagsInputItem
                        v-for="tag in tags"
                        :key="tag"
                        :value="tag"
                        data-tag
                        :data-invalid-tag="isInvalid(tag) ? '' : undefined"
                        :title="isInvalid(tag) && emails ? messages.invalidEmail : undefined"
                        :class="cn(
                            'inline-flex h-6 items-center gap-1 rounded-md border px-2 text-sm data-[state=active]:ring-2 data-[state=active]:ring-ring',
                            isInvalid(tag)
                                ? 'border-destructive/50 bg-destructive/10 text-destructive'
                                : 'border-transparent bg-secondary text-secondary-foreground',
                        )"
                    >
                        <TagsInputItemText>{{ labelFor(tag) }}</TagsInputItemText>
                        <TagsInputItemDelete
                            v-if="!isLocked"
                            :aria-label="`${messages.remove} ${labelFor(tag)}`"
                            class="inline-flex size-4 items-center justify-center rounded-sm opacity-70 hover:opacity-100"
                        >
                            <X class="size-3" />
                        </TagsInputItemDelete>
                    </TagsInputItem>

                    <ComboboxInput v-model="query" as-child>
                        <TagsInputInput
                            :id="name"
                            :readonly="isFull"
                            :placeholder="tags.length === 0 ? placeholder : undefined"
                            :aria-invalid="fieldError ? true : undefined"
                            :class="cn(
                                'bg-transparent px-1 py-0.5 outline-none placeholder:text-muted-foreground',
                                isFull ? 'w-1 min-w-0 flex-none caret-transparent' : 'min-w-24 flex-1',
                            )"
                            @paste="handlePaste"
                        />
                    </ComboboxInput>
                </TagsInputRoot>
            </ComboboxAnchor>

            <ComboboxPortal v-if="suggestionsUrl">
                <ComboboxContent
                    position="popper"
                    :side-offset="4"
                    class="z-50 w-(--reka-combobox-trigger-width) min-w-48 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
                    data-tag-suggestions
                >
                    <ComboboxViewport class="max-h-60">
                        <ComboboxEmpty class="px-2 py-1.5 text-sm text-muted-foreground">
                            {{ messages.noResults }}
                        </ComboboxEmpty>
                        <ComboboxItem
                            v-for="suggestion in openSuggestions"
                            :key="suggestion.value"
                            :value="suggestion.value"
                            class="flex cursor-default flex-col rounded-sm px-2 py-1.5 text-sm outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                            @select.prevent="choose(suggestion)"
                        >
                            <span>{{ suggestion.label }}</span>
                            <span v-if="showsSuggestionValue(suggestion)" class="text-xs text-muted-foreground">{{ suggestion.value }}</span>
                        </ComboboxItem>
                    </ComboboxViewport>
                </ComboboxContent>
            </ComboboxPortal>
        </ComboboxRoot>

        <template v-if="name">
            <input
                v-for="tag in tags"
                :key="`hidden-${tag}`"
                type="hidden"
                :name="`${name}[]`"
                :value="tag"
            />
        </template>
    </BaseField>
</template>
