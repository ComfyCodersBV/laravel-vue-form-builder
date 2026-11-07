<script setup lang="ts">
import BaseField from './BaseField.vue';
import { useFieldListeners } from '../../lib/listeners';
import { cn } from '../../lib/utils';
import type { Field } from '../../types/form-builder';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger } from '../ui/select';
import { MultiSelect } from '../ui/multi-select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ChevronsUpDown, X } from '@lucide/vue';
import { useDebounceFn } from '@vueuse/core';
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useFormMessages } from '../../lib/messages'
import { suggestionsRequestUrl } from '../../lib/tags'
import { codeWidth, groupOptions, hasGroups, optionMatches, toOptions, type SelectOption } from '../../lib/options'
import OptionContent from './OptionContent.vue'

type Option = SelectOption;
type Options = Record<string, string> | Array<Option> | Array<string | number>;
type OptionSearch = (query: string) => Promise<Array<any>> | Array<any>;

const SEARCH_DELAY = 250;

interface SelectProps extends Field {
    options?: Options;
    optionOrder?: Array<string | number>;
    placeholder?: string;
    multiple?: boolean;
    optionLabel?: string;
    optionValue?: string;
    optionCode?: string;
    searchable?: boolean;
    searchPlaceholder?: string;
    noResultsLabel?: string;
    choosePlaceholder?: string;
    clearable?: boolean;
    clearLabel?: string;
    search?: OptionSearch;
    minSearchLength?: number;
    selectedLabel?: string;
    searchUrl?: string;
    selected?: Option | null;
}

const props = withDefaults(defineProps<SelectProps>(), {
    className: undefined,
    disabled: false,
    error: undefined,
    label: undefined,
    modelValue: '',
    options: () => ({} as Options),
    optionOrder: undefined,
    optionLabel: 'name',
    optionValue: 'id',
    optionCode: undefined,
    placeholder: undefined,
    readonly: false,
    multiple: false,
    clearable: false,
    clearLabel: undefined,
    searchable: false,
    searchPlaceholder: undefined,
    noResultsLabel: undefined,
    choosePlaceholder: undefined,
    search: undefined,
    minSearchLength: 1,
    selectedLabel: undefined,
    searchUrl: undefined,
    selected: undefined,
});

const emit = defineEmits<{ 'update:modelValue': [any] }>();

const messageContext = useFormMessages()
const messages = computed(() => messageContext.value.messages)

const optionLabel = computed(() => props.optionLabel!);
const optionValue = computed(() => props.optionValue!);

function getProp(obj: any, key: string): any {
    if (!obj) {
        return undefined;
    }

    if (key in obj) {
        return obj[key];
    }

    if (typeof obj[key] === 'function') {
        return obj[key]();
    }

    return undefined;
}

const searchesUrl = computed(() => typeof props.search !== 'function' && Boolean(props.searchUrl));
const isRemote = computed(() => typeof props.search === 'function' || searchesUrl.value);
let searchController: AbortController | null = null;

async function searchUrl(query: string): Promise<Array<Option>> {
    searchController?.abort();
    searchController = new AbortController();

    const response = await fetch(suggestionsRequestUrl(props.searchUrl!, query), {
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
        signal: searchController.signal,
    });

    if (!response.ok) {
        throw new Error(`Search failed with status ${response.status}`);
    }

    const payload: unknown = await response.json();

    return (Array.isArray(payload) ? payload : []).filter(isOption);
}

function isOption(value: unknown): value is Option {
    if (value === null || typeof value !== 'object') {
        return false;
    }

    const candidate = value as Record<string, unknown>;

    return (typeof candidate.value === 'string' || typeof candidate.value === 'number')
        && typeof candidate.label === 'string';
}

const searchFunction = computed<OptionSearch | undefined>(() => searchesUrl.value ? searchUrl : props.search);

onBeforeUnmount(() => searchController?.abort());
const remoteResults = ref<Array<any>>([]);
const remoteSelected = ref<Option | null>(null);
const isSearching = ref(false);
const searchFailed = ref(false);

const optionsList = computed<Option[]>(() => {
    if (searchesUrl.value) {
        return toOptions(remoteResults.value, 'label', 'value', undefined, props.optionCode ? 'code' : undefined);
    }

    if (isRemote.value) {
        return toOptions(remoteResults.value, optionLabel.value, optionValue.value, undefined, props.optionCode);
    }

    return toOptions(props.options, optionLabel.value, optionValue.value, props.optionOrder, props.optionCode);
});

const optionGroups = computed(() => groupOptions(optionsList.value));

const isGrouped = computed(() => hasGroups(optionsList.value));

const selectedOption = computed<Option | null>(() => {
    if (!internalKey.value) return null;

    const found = optionsList.value.find(
        option => String(option.value) === String(internalKey.value)
    );

    if (found) {
        return found;
    }

    if (isRemote.value && remoteSelected.value && String(remoteSelected.value.value) === internalKey.value) {
        return remoteSelected.value;
    }

    if (isRemote.value && props.selected && String(props.selected.value) === internalKey.value) {
        return props.optionCode ? props.selected : { value: props.selected.value, label: props.selected.label };
    }

    if (isRemote.value && props.selectedLabel) {
        return { value: internalKey.value, label: props.selectedLabel };
    }

    return { value: internalKey.value, label: String(internalKey.value) };
});

const listCodeWidth = computed(() => codeWidth(optionsList.value));

const triggerCodeWidth = computed(() => listCodeWidth.value ?? codeWidth(selectedOption.value ? [selectedOption.value] : []));

const internalKey = ref<string>('');
const selectedLocal = ref<Array<string | number>>([]);

watch(
    () => props.modelValue,
    (v) => {
        const newVal = Array.isArray(v)
            ? v.map(item => typeof item === 'object' ? getProp(item, optionValue.value) : item)
            : []

        if (JSON.stringify(newVal) !== JSON.stringify(selectedLocal.value)) {
            selectedLocal.value = newVal
        }

        internalKey.value = !Array.isArray(v) && v != null ? String(v) : ''
    },
    { immediate: true }
)

watch(optionsList, (opts) => {
    if (isRemote.value) {
        return
    }

    const allowed = new Set(opts.map(o => String(o.value)))

    if (props.multiple) {
        const filtered = selectedLocal.value.filter(v => allowed.has(String(v)))
        if (JSON.stringify(filtered) !== JSON.stringify(selectedLocal.value)) {
            selectedLocal.value = filtered
            emit('update:modelValue', filtered as any)
        }
    } else {
        if (internalKey.value && !allowed.has(String(internalKey.value))) {
            internalKey.value = ''
            emit('update:modelValue', '' as any)
        }
    }
})

watch(selectedLocal, (v, old) => {
    if (JSON.stringify(v) !== JSON.stringify(old)) {
        emit('update:modelValue', v as any)
    }
})

function onUpdateInternal(value: unknown) {
    const key = value == null ? '' : String(value);
    internalKey.value = key;
    const found = optionsList.value.find(o => String(o.value) === key);
    remoteSelected.value = isRemote.value && found ? found : null;
    emit('update:modelValue', (found ? found.value : key) as any);
}

const comboboxOpen = ref(false);
const comboboxQuery = ref('');
const comboboxSearchWrapper = ref<HTMLElement | null>(null);

watch(comboboxOpen, (open) => {
    if (!open) {
        if (isRemote.value) {
            comboboxQuery.value = '';
            remoteResults.value = [];
            searchFailed.value = false;
        }

        return;
    }

    nextTick(() => requestAnimationFrame(() => comboboxSearchWrapper.value?.querySelector('input')?.focus()));
});

function rememberSelected() {
    const found = optionsList.value.find(option => String(option.value) === internalKey.value);

    if (found) {
        remoteSelected.value = found;
    }
}

async function runSearch(query: string) {
    const search = searchFunction.value;

    if (!search || query.trim().length < props.minSearchLength!) {
        remoteResults.value = [];
        isSearching.value = false;

        return;
    }

    try {
        const results = await search(query.trim());

        if (query === comboboxQuery.value) {
            remoteResults.value = Array.isArray(results) ? results : [];
            searchFailed.value = false;
            rememberSelected();
        }
    } catch {
        if (query === comboboxQuery.value) {
            remoteResults.value = [];
            searchFailed.value = true;
        }
    } finally {
        if (query === comboboxQuery.value) {
            isSearching.value = false;
        }
    }
}

const debouncedSearch = useDebounceFn(runSearch, SEARCH_DELAY);

watch(comboboxQuery, (query) => {
    if (!isRemote.value) {
        return;
    }

    searchFailed.value = false;
    isSearching.value = query.trim().length >= props.minSearchLength!;
    debouncedSearch(query);
});

const isBelowMinimum = computed(() => isRemote.value && comboboxQuery.value.trim().length < props.minSearchLength!);

const comboboxFilteredOptions = computed(() => {
    if (isRemote.value) {
        return isBelowMinimum.value ? [] : optionsList.value;
    }

    if (!comboboxQuery.value) {
        return optionsList.value;
    }

    return optionsList.value.filter(option => optionMatches(option, comboboxQuery.value));
});

const comboboxGroups = computed(() => groupOptions(comboboxFilteredOptions.value));

function selectComboboxOption(option: Option) {
    onUpdateInternal(option.value);
    comboboxOpen.value = false;
    comboboxQuery.value = '';
}

const isClearable = computed(() => props.clearable
    && !props.disabled
    && !props.readonly
    && internalKey.value !== '');

function clearValue() {
    onUpdateInternal('');
}

defineOptions({ inheritAttrs: false });

const { listeners, wrapperAttrs } = useFieldListeners();
</script>

<template>
    <BaseField v-bind="wrapperAttrs()" :label="props.label" :name="props.name" :error="props.error" :help="props.help" :class-name="props.className" :theme="props.theme">
        <template v-if="!props.multiple && (props.searchable || isRemote)">
            <div class="relative">
                <Popover v-model:open="comboboxOpen">
                    <PopoverTrigger as-child>
                        <Button
                            v-bind="listeners()"
                            type="button"
                            variant="outline"
                            :id="props.name"
                            :disabled="props.disabled || props.readonly"
                            :class="cn('w-full min-w-0 justify-between font-normal', props.inputClassName)"
                        >
                            <span class="truncate" :class="{ 'mr-8': isClearable }">
                                <OptionContent v-if="selectedOption" :option="selectedOption" :code-width="triggerCodeWidth" :html="!isRemote" />
                                <span v-else class="text-muted-foreground">
                                    {{ props.placeholder ?? props.choosePlaceholder ?? messages.chooseOption }}
                                </span>
                            </span>
                            <ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" class="w-[var(--reka-popover-trigger-width)] p-2">
                        <div ref="comboboxSearchWrapper">
                            <Input
                                v-model="comboboxQuery"
                                :placeholder="props.searchPlaceholder ?? messages.search"
                                :aria-label="props.searchPlaceholder ?? messages.search"
                                class="mb-2 h-8"
                            />
                        </div>
                        <div class="max-h-64 overflow-auto">
                            <div
                                v-for="(group, groupIndex) in comboboxGroups"
                                :key="`group-${groupIndex}`"
                                :role="group.label === null ? undefined : 'group'"
                                :aria-label="group.label ?? undefined"
                            >
                                <div
                                    v-if="group.label !== null"
                                    class="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground"
                                    data-select-group
                                >
                                    {{ group.label }}
                                </div>
                                <button
                                    v-for="option in group.options"
                                    :key="String(option.value)"
                                    type="button"
                                    class="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                                    :class="String(option.value) === internalKey ? 'bg-accent' : ''"
                                    @click="selectComboboxOption(option)"
                                >
                                    <OptionContent :option="option" :code-width="listCodeWidth" :html="!isRemote" />
                                </button>
                            </div>
                            <div role="status" aria-live="polite">
                                <div v-if="isBelowMinimum" class="px-2 py-3 text-xs text-muted-foreground" data-select-hint>
                                    {{ messages.typeToSearch }}
                                </div>
                                <div v-else-if="searchFailed" class="px-2 py-3 text-xs text-destructive" data-select-hint>
                                    {{ messages.searchFailed }}
                                </div>
                                <div v-else-if="isSearching" class="px-2 py-3 text-xs text-muted-foreground" data-select-hint>
                                    {{ messages.searching }}
                                </div>
                                <div v-else-if="!comboboxFilteredOptions.length" class="px-2 py-3 text-xs text-muted-foreground">
                                    {{ props.noResultsLabel ?? messages.noResults }}
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                <button
                    v-if="isClearable"
                    type="button"
                    class="absolute top-1/2 right-8 -translate-y-1/2 cursor-pointer rounded-sm p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                    :title="props.clearLabel ?? messages.clear"
                    :aria-label="props.clearLabel ?? messages.clear"
                    @click="clearValue"
                >
                    <X class="size-4" />
                </button>
            </div>

            <input v-if="props.name" type="hidden" :name="props.name" :value="internalKey" />
        </template>

        <template v-else-if="!props.multiple">
            <div class="relative">
                <Select
                    v-model="internalKey"
                    :disabled="props.disabled || props.readonly"
                    @update:model-value="onUpdateInternal"
                >
                    <SelectTrigger v-bind="listeners()" :id="props.name" :class="cn('w-full min-w-0 justify-between', props.inputClassName)">
                        <span class="truncate" :class="{ 'mr-8': isClearable }">
                            <OptionContent v-if="selectedOption" :option="selectedOption" :code-width="triggerCodeWidth" html />
                            <span v-else class="text-muted-foreground">
                                {{ props.placeholder ?? props.choosePlaceholder ?? messages.chooseOption }}
                            </span>
                        </span>
                    </SelectTrigger>
                    <SelectContent class="min-w-[var(--reka-select-trigger-width)]">
                        <template v-if="isGrouped">
                            <SelectGroup v-for="(group, groupIndex) in optionGroups" :key="`group-${groupIndex}`">
                                <SelectLabel v-if="group.label !== null" data-select-group>{{ group.label }}</SelectLabel>
                                <SelectItem
                                    v-for="option in group.options"
                                    :key="String(option.value)"
                                    :value="String(option.value)"
                                >
                                    <OptionContent :option="option" :code-width="listCodeWidth" html tag="div" label-class="flex justify-between items-center w-full" />
                                </SelectItem>
                            </SelectGroup>
                        </template>
                        <template v-else>
                            <SelectItem
                                v-for="option in optionsList"
                                :key="String(option.value)"
                                :value="String(option.value)"
                            >
                                <OptionContent :option="option" :code-width="listCodeWidth" html tag="div" label-class="flex justify-between items-center w-full" />
                            </SelectItem>
                        </template>
                    </SelectContent>
                    <input v-if="props.name" type="hidden" :name="props.name" :value="internalKey" />
                </Select>

                <button
                    v-if="isClearable"
                    type="button"
                    class="absolute top-1/2 right-8 -translate-y-1/2 cursor-pointer rounded-sm p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                    :title="props.clearLabel ?? messages.clear"
                    :aria-label="props.clearLabel ?? messages.clear"
                    @click="clearValue"
                >
                    <X class="size-4" />
                </button>
            </div>
        </template>

        <template v-else>
            <input type="hidden" :name="props.name" value="" />
            <MultiSelect
                v-bind="listeners()"
                :class="props.inputClassName"
                v-model="selectedLocal"
                :options="optionsList"
                :placeholder="props.placeholder ?? undefined"
                :disabled="props.disabled"
                :readonly="props.readonly"
            />
            <template v-if="props.name">
                <input
                    v-for="val in selectedLocal"
                    :key="`hidden-${String(val)}`"
                    type="hidden"
                    :name="`${props.name}[]`"
                    :value="String(val)"
                />
            </template>
        </template>
    </BaseField>
</template>
