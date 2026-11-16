    <script setup lang="ts">
    import { useFormContext } from '@inertiajs/vue3'
    import FormField from './FormField.vue'
    import type { Field } from '../types/form-builder'
    import { computed, inject } from 'vue'
    import { provideFieldIdPrefix } from '../lib/field-id'
    import { formFieldsKey } from '../lib/fields'
    import { conditionData, formValues, meetsCondition } from '../lib/conditions'
    import { mediumColumnsOf, normalizeColumns, responsiveSpanOf, spanOf, type FormColumns } from '../lib/layout'

    const { fields, form: propForm, onFieldChange, fieldOverrides, columns: requestedColumns = 1, layoutFromForm = false, idPrefix } = defineProps<{
        fields: Field[]
        form?: any
        onFieldChange?: (field: string, value: any) => void
        fieldOverrides?: Record<string, Partial<Field & Record<string, any>>>
        columns?: FormColumns
        layoutFromForm?: boolean
        idPrefix?: string
    }>()

    if (idPrefix !== undefined) {
        provideFieldIdPrefix(() => idPrefix)
    }

    const columns = computed((): FormColumns => normalizeColumns(requestedColumns))

    const GRID_CLASSES: Record<FormColumns, string> = {
        1: '',
        2: 'grid gap-x-6 gap-y-4 md:grid-cols-2',
        3: 'grid gap-x-6 gap-y-4 md:grid-cols-3',
        4: 'grid gap-x-6 gap-y-4 md:grid-cols-4',
        5: 'grid gap-x-6 gap-y-4 md:grid-cols-3 lg:grid-cols-5',
        6: 'grid gap-x-6 gap-y-4 md:grid-cols-3 lg:grid-cols-6',
        12: 'grid gap-x-6 gap-y-4 md:grid-cols-6 lg:grid-cols-12',
    }

    const MEDIUM_SPAN_CLASSES: Record<number, string> = {
        1: '',
        2: 'md:col-span-2',
        3: 'md:col-span-3',
        4: 'md:col-span-4',
        5: 'md:col-span-5',
        6: 'md:col-span-6',
    }

    const LARGE_SPAN_CLASSES: Record<number, string> = {
        1: '',
        2: 'lg:col-span-2',
        3: 'lg:col-span-3',
        4: 'lg:col-span-4',
        5: 'lg:col-span-5',
        6: 'lg:col-span-6',
        7: 'lg:col-span-7',
        8: 'lg:col-span-8',
        9: 'lg:col-span-9',
        10: 'lg:col-span-10',
        11: 'lg:col-span-11',
        12: 'lg:col-span-12',
    }

    function cellClass(field: Field): string {
        const span = spanOf({ ...field, ...(fieldOverrides?.[field.name ?? ''] ?? {}) }, columns.value)
        const { medium, large } = responsiveSpanOf(span, columns.value)

        if (mediumColumnsOf(columns.value) === columns.value) {
            return MEDIUM_SPAN_CLASSES[medium]
        }

        return [MEDIUM_SPAN_CLASSES[medium], LARGE_SPAN_CLASSES[large]].filter(Boolean).join(' ')
    }

    const form = propForm ?? useFormContext()

    const formFields = inject(formFieldsKey, [])

    function isVisible(field: Field): boolean {
        if (! field.condition && ! field.when) {
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
