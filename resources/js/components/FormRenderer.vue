    <script setup lang="ts">
    import { useFormContext } from '@inertiajs/vue3'
    import FormField from './FormField.vue'
    import type { Field } from '../types/form-builder'
    import { computed, inject } from 'vue'
    import { flattenFields, formFieldsKey } from '../lib/fields'
    import { normalizeColumns, spanOf, type FormColumns } from '../lib/layout'

    const { fields, form: propForm, onFieldChange, fieldOverrides, columns: requestedColumns = 1 } = defineProps<{
        fields: Field[]
        form?: any
        onFieldChange?: (field: string, value: any) => void
        fieldOverrides?: Record<string, Partial<Field & Record<string, any>>>
        columns?: FormColumns
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

    const BOOLEAN_FIELD_TYPES = ['checkbox', 'toggle']

    function isOn(value: any, onValue: any): boolean {
        if (value === true || value === false) {
            return value
        }

        if (value === undefined || value === null) {
            return false
        }

        return String(value) === String(onValue ?? '1')
    }

    function conditionData(data: Record<string, any>): Record<string, any> {
        const normalized = { ...data }

        flattenFields([...formFields, ...fields]).forEach((field: any) => {
            if (! field?.name || ! BOOLEAN_FIELD_TYPES.includes(field.type) || ! (field.name in normalized)) {
                return
            }

            normalized[field.name] = isOn(normalized[field.name], field.value)
        })

        return normalized
    }

    function isVisible(field: Field): boolean {
        if (! field.condition) {
            return true
        }

        try {
            const data: Record<string, any> = conditionData(typeof (form as any).data === 'function'
                ? (form as any).data()
                : { ...form })

            const keys = Object.keys(data)
            const values = keys.map((k) => data[k])
            const fn = new Function('form', ...keys, `return !!(${field.condition})`)

            return fn(data, ...values)
        } catch {
            return true
        }
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

        <template v-else>
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
    </template>
