<script setup lang="ts">
import BaseField from './BaseField.vue'
import { Input } from '../ui/input'
import type { Field } from '../../types/form-builder'
import { computed } from 'vue'
import { cn } from '../../lib/utils'

interface ColorFieldProps extends Field {
    swatches?: string[]
}

const props = withDefaults(defineProps<ColorFieldProps>(), {
    className: undefined,
    disabled: false,
    error: undefined,
    label: undefined,
    modelValue: '',
    name: undefined,
    placeholder: '#000000',
    readonly: false,
    swatches: () => [],
})

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const model = computed<string>({
    get: () => ((props.modelValue as string) ?? '').toString(),
    set: (value) => emit('update:modelValue', value),
})

const pickerValue = computed(() => (/^#[0-9a-f]{6}$/i.test(model.value) ? model.value : '#000000'))

function selectSwatch(swatch: string): void {
    if (props.disabled || props.readonly) {
        return
    }

    model.value = swatch
}
</script>

<template>
    <BaseField v-bind="{ label, name, error, className, help, theme }">
        <div class="flex w-full flex-col gap-2">
            <div class="flex w-full">
                <input
                    type="color"
                    :id="name ? `${name}_picker` : undefined"
                    :disabled="disabled || readonly"
                    :value="pickerValue"
                    class="h-9 w-12 shrink-0 cursor-pointer rounded-l-md border border-input bg-background p-1 disabled:cursor-not-allowed"
                    @input="model = ($event.target as HTMLInputElement).value"
                />

                <Input
                    :id="name"
                    :name="name"
                    :disabled="disabled"
                    :readonly="readonly"
                    :placeholder="placeholder"
                    type="text"
                    v-model="model"
                    :class="cn('flex-1 rounded-l-none dark:text-neutral-100')"
                />
            </div>

            <div v-if="swatches.length > 0" class="flex flex-wrap gap-1.5">
                <button
                    v-for="swatch in swatches"
                    :key="swatch"
                    type="button"
                    :disabled="disabled || readonly"
                    :title="swatch"
                    :aria-label="swatch"
                    :aria-pressed="model.toLowerCase() === swatch.toLowerCase()"
                    :style="{ backgroundColor: swatch }"
                    :class="cn(
                        'size-6 rounded-md border border-input transition',
                        model.toLowerCase() === swatch.toLowerCase() ? 'ring-2 ring-ring ring-offset-1' : '',
                    )"
                    @click="selectSwatch(swatch)"
                />
            </div>
        </div>
    </BaseField>
</template>
