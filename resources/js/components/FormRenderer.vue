    <script setup lang="ts">
    import { useFormContext } from '@inertiajs/vue3'
    import FormField from './FormField.vue'
    import type { Field } from '../types/form-builder'
    import { computed, inject } from 'vue'
    import { formFieldsKey } from '../lib/fields'
    import { conditionData, formValues, meetsCondition } from '../lib/conditions'
    import { normalizeColumns, spanOf, type FormColumns } from '../lib/layout'

    const { fields, form: propForm, onFieldChange, fieldOverrides, columns: requestedColumns = 1, layoutFromForm = false } = defineProps<{
        fields: Field[]
        form?: any
        onFieldChange?: (field: string, value: any) => void
        fieldOverrides?: Record<string, Partial<Field & Record<string, any>>>
        columns?: FormColumns
        layoutFromForm?: boolean
    }>()

    const columns = computed((): FormColumns => normalizeColumns(requestedColumns))

    const GRID_CLASSES: Record<FormColumns, string> = {
        1: '',
        2: 'grid gap-x-6 gap-y-4 md:grid-cols-2',
        3: 'grid gap-x-6 gap-y-4 md:grid-cols-3',
        4: 'grid gap-x-6 gap-y-4 md:grid-cols-4',
    }

    const SPAN_CLASSES: Record<FormColumns, string> = {
        1: '',
        2: 'md:col-span-2',
        3: 'md:col-span-3',
        4: 'md:col-span-4',
    }

    function cellClass(field: Field): string {
        const span = spanOf({ ...field, ...(fieldOverrides?.[field.name ?? ''] ?? {}) }, columns.value)

        return SPAN_CLASSES[normalizeColumns(span)]
    }

    const form = propForm ?? useFormContext()

    const formFields = inject(formFieldsKey, [])

    function isVisible(field: Field): boolean {
        if (! field.condition) {
            return true
        }

        return meetsCondition(field, conditionData(formValues(form), [...formFields, ...fields]))
    }
    </script>

    <template>
        <div v-if="columns > 1" :class="GRID_CLASSES[columns]">
            <template v-for="(field, i) in fields" :key="field.name ?? i">
                <div v-if="isVisible(field)" :class="cellClass(field)">
                    <FormField
                        :field="field"
                        :form="form"
                        :on-field-change="onFieldChange"
                        :field-overrides="fieldOverrides"
                    />
                </div>
            </template>
        </div>

        <template v-else-if="layoutFromForm">
            <template v-for="(field, i) in fields" :key="field.name ?? i">
                <FormField
                    v-if="isVisible(field)"
                    :field="field"
                    :form="form"
                    :on-field-change="onFieldChange"
                    :field-overrides="fieldOverrides"
                />
            </template>
        </template>

        <div v-else class="space-y-4">
            <template v-for="(field, i) in fields" :key="field.name ?? i">
                <FormField
                    v-if="isVisible(field)"
                    :field="field"
                    :form="form"
                    :on-field-change="onFieldChange"
                    :field-overrides="fieldOverrides"
                />
            </template>
        </div>
    </template>
