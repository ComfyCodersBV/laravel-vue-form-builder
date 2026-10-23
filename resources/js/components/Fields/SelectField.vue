<script setup lang="ts">
import BaseField from './BaseField.vue';
import type { Field } from '../../types/form-builder';
import { Select, SelectContent, SelectItem, SelectTrigger } from '../ui/select';
import { MultiSelect } from '../ui/multi-select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ChevronsUpDown, X } from '@lucide/vue';
import { useDebounceFn } from '@vueuse/core';
import { computed, nextTick, ref, watch } from 'vue';
import { useFormMessages } from '../../lib/messages'

interface Option { value: string | number; label: string }
type Options = Record<string, string> | Array<Option> | Array<string | number>;
type OptionSearch = (query: string) => Promise<Array<any>> | Array<any>;

const SEARCH_DELAY = 250;

interface SelectProps extends Field {
    options?: Options;
    placeholder?: string;
    multiple?: boolean;
    optionLabel?: string;
    optionValue?: string;
    searchable?: boolean;
    searchPlaceholder?: string;
    noResultsLabel?: string;
    choosePlaceholder?: string;
    clearable?: boolean;
    clearLabel?: string;
    search?: OptionSearch;
    minSearchLength?: number;
    selectedLabel?: string;
}

const props = withDefaults(defineProps<SelectProps>(), {
    className: undefined,
    disabled: false,
    error: undefined,
    label: undefined,
    modelValue: '',
    options: () => ({} as Options),
    optionLabel: 'name',
    optionValue: 'id',
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

const isRemote = computed(() => typeof props.search === 'function');
const remoteResults = ref<Array<any>>([]);
const remoteSelected = ref<Option | null>(null);
const isSearching = ref(false);
const searchFailed = ref(false);

function toOptions(optionsValue: Options | undefined): Option[] {
    if (! optionsValue) {
        return [];
    }

    if (Array.isArray(optionsValue)) {
        return optionsValue.map((item: any) => {
            if (typeof item === 'object' && item !== null) {
                const label = getProp(item, optionLabel.value) ?? String(item);
                const value = getProp(item, optionValue.value) ?? String(item);

                return { value, label };
            }

            return {
                value: item,
                label: String(item)
            };
        });
    }

    return Object.entries(optionsValue as Record<string, string>).map(
        ([value, label]) => ({ value, label })
    );
}

const optionsList = computed<Option[]>(() => toOptions(isRemote.value ? remoteResults.value : props.options));

const selectedOptionLabel = computed(() => {
    if (!internalKey.value) return '';

    const found = optionsList.value.find(
        option => String(option.value) === String(internalKey.value)
    );

    if (found) {
        return found.label;
    }

    if (isRemote.value && remoteSelected.value && String(remoteSelected.value.value) === internalKey.value) {
        return remoteSelected.value.label;
    }

    if (isRemote.value && props.selectedLabel) {
        return props.selectedLabel;
    }

    return String(internalKey.value);
});

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
    if (!props.search || query.trim().length < props.minSearchLength!) {
        remoteResults.value = [];
        isSearching.value = false;

        return;
    }

    try {
        const results = await props.search(query.trim());

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

    const query = comboboxQuery.value.toLowerCase();

    return optionsList.value.filter(option => option.label.toLowerCase().includes(query));
});

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
</script>

<template>
    <BaseField :label="props.label" :name="props.name" :error="props.error" :help="props.help" :class-name="props.className" :theme="props.theme">
        <template v-if="!props.multiple && (props.searchable || isRemote)">
            <div class="flex items-center gap-1">
                <Popover v-model:open="comboboxOpen">
                    <PopoverTrigger as-child>
                        <Button
                            type="button"
                            variant="outline"
                            :id="props.name"
                            :disabled="props.disabled || props.readonly"
                            class="w-full justify-between font-normal"
                        >
                            <span class="truncate">
                                <span v-if="selectedOptionLabel && isRemote">{{ selectedOptionLabel }}</span>
                                <span v-else-if="selectedOptionLabel" v-html="selectedOptionLabel"></span>
                                <span v-else class="text-muted-foreground">
                                    {{ props.placeholder ?? props.choosePlaceholder ?? messages.chooseOption }}
                                </span>
                            </span>
                            <ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" class="w-[var(--reka-popover-trigger-width)] p-2">
                        <div ref="comboboxSearchWrapper">
                            <Input v-model="comboboxQuery" :placeholder="props.searchPlaceholder ?? messages.search" class="mb-2 h-8" />
                        </div>
                        <div class="max-h-64 overflow-auto">
                            <button
                                v-for="option in comboboxFilteredOptions"
                                :key="String(option.value)"
                                type="button"
                                class="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                                :class="String(option.value) === internalKey ? 'bg-accent' : ''"
                                @click="selectComboboxOption(option)"
                            >
                                <span v-if="isRemote" class="truncate">{{ option.label }}</span>
                                <span v-else class="truncate" v-html="option.label"></span>
                            </button>
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
                    </PopoverContent>
                </Popover>

                <button
                    v-if="isClearable"
                    type="button"
                    class="shrink-0 cursor-pointer rounded-md border border-input p-2 text-muted-foreground hover:text-foreground"
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
            <div class="flex items-center gap-1">
                <Select
                    v-model="internalKey"
                    :disabled="props.disabled || props.readonly"
                    @update:model-value="onUpdateInternal"
                >
                    <SelectTrigger :id="props.name" class="w-full justify-between">
                        <span class="truncate">
                            <span v-if="selectedOptionLabel" v-html="selectedOptionLabel"></span>
                            <span v-else class="text-muted-foreground">
                                {{ props.placeholder ?? props.choosePlaceholder ?? messages.chooseOption }}
                            </span>
                        </span>
                    </SelectTrigger>
                    <SelectContent class="min-w-[var(--reka-select-trigger-width)]">
                        <SelectItem
                            v-for="option in optionsList"
                            :key="String(option.value)"
                            :value="String(option.value)"
                        >
                            <div v-html="option.label" class="flex justify-between items-center w-full"></div>
                        </SelectItem>
                    </SelectContent>
                    <input v-if="props.name" type="hidden" :name="props.name" :value="internalKey" />
                </Select>

                <button
                    v-if="isClearable"
                    type="button"
                    class="shrink-0 cursor-pointer rounded-md border border-input p-2 text-muted-foreground hover:text-foreground"
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
