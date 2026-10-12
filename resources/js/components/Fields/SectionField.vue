<script setup lang="ts">
import { computed, inject, provide } from 'vue'
import type { Field } from '../../types/form-builder'
import { columnsKey, normalizeColumns, type FormColumns } from '../../lib/layout'
import FormRenderer from '../FormRenderer.vue'

interface SectionFieldProps {
    field: Field & { title?: string; description?: string }
    form: any
    onFieldChange?: (field: string, value: any) => void
    fieldOverrides?: Record<string, Partial<Field & Record<string, any>>>
}

const props = defineProps<SectionFieldProps>()

const inherited = inject(columnsKey, computed((): FormColumns => 1))

const columns = computed((): FormColumns => typeof props.field.columns === 'undefined'
    ? inherited.value
    : normalizeColumns(props.field.columns))

provide(columnsKey, columns)

const hasHeading = computed(() => Boolean(props.field.title || props.field.description))
</script>

<template>
    <section :class="field.className ?? 'space-y-4'" data-form-section>
        <header v-if="hasHeading" class="space-y-1 border-b border-neutral-200 pb-2 dark:border-neutral-700">
            <h3 v-if="field.title" class="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                {{ field.title }}
            </h3>
            <div
                v-if="field.description"
                class="text-sm text-neutral-500 dark:text-neutral-400"
                v-html="field.description"
            />
        </header>

        <FormRenderer
            v-if="field.fields?.length"
            :fields="field.fields"
            :form="form"
            :columns="columns"
            :on-field-change="onFieldChange"
            :field-overrides="fieldOverrides"
        />
    </section>
</template>
