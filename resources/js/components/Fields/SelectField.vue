<script setup lang="ts">
import BaseField from './BaseField.vue';
import type { Field } from '../../types/form-builder';
import { Select, SelectContent, SelectItem, SelectTrigger } from '../ui/select';
import { MultiSelect } from '../ui/multi-select';
import { computed, ref, watch } from 'vue';

interface Option { value: string | number; label: string }
type Options = Record<string, string> | Array<Option> | Array<string | number>;

interface SelectProps extends Field {
    options?: Options;
    placeholder?: string;
    multiple?: boolean;
    optionLabel?: string;
    optionValue?: string;
}

const props = withDefaults(defineProps<SelectProps>(), {
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
});

const emit = defineEmits<{ 'update:modelValue': [any] }>();

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

const optionsList = computed<Option[]>(() => {
    const optionsValue = props.options;
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
});

const selectedOptionLabel = computed(() => {
    if (!internalKey.value) return '';

    const found = optionsList.value.find(
        option => String(option.value) === String(internalKey.value)
    );

    return found ? found.label : String(internalKey.value);
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

watch(selectedLocal, (v, old) => {
    if (JSON.stringify(v) !== JSON.stringify(old)) {
        emit('update:modelValue', v as any)
    }
})

function onUpdateInternal(value: unknown) {
    const key = value == null ? '' : String(value);
    internalKey.value = key;
    const found = optionsList.value.find(o => String(o.value) === key);
    emit('update:modelValue', (found ? found.value : key) as any);
}
</script>

<template>
    <BaseField :label="props.label" :name="props.name" :error="props.error" :help="props.help">
        <template v-if="!props.multiple">
            <Select
                v-model="internalKey"
                :disabled="props.disabled || props.readonly"
                @update:model-value="onUpdateInternal"
            >
                <SelectTrigger :id="props.name" class="w-full justify-between">
                    <span class="truncate">
                        <span v-if="selectedOptionLabel" v-html="selectedOptionLabel"></span>
                        <span v-else class="text-muted-foreground">
                            {{ props.placeholder ?? 'Choose an option' }}
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
        </template>

        <template v-else>
            <input type="hidden" :name="props.name" value="" />
            <MultiSelect
                v-model="selectedLocal"
                :options="optionsList"
                :placeholder="props.placeholder ?? ''"
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
