    <script setup lang="ts">
    import { useFormContext } from '@inertiajs/vue3'
    import FormField from './FormField.vue'
    import type { Field } from '../types/form-builder'

    const { fields, form: propForm, onFieldChange, fieldOverrides, columns = 1 } = defineProps<{
        fields: Field[]
        form?: any
        onFieldChange?: (field: string, value: any) => void
        fieldOverrides?: Record<string, Partial<Field & Record<string, any>>>
        columns?: 1 | 2
    }>()

    const FULL_WIDTH_TYPES = ['wysiwyg', 'textarea', 'repeater', 'keyvalue', 'submit', 'button', 'delete', 'hidden']

    function spansFullWidth(field: Field): boolean {
        return field.fullWidth === true || FULL_WIDTH_TYPES.includes(field.type ?? '')
    }

    const form = propForm ?? useFormContext()

    function isVisible(field: Field): boolean {
        if (! field.condition) {
            return true
        }

        try {
            const data: Record<string, any> = typeof (form as any).data === 'function'
                ? (form as any).data()
                : { ...form }

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
        <div v-if="columns === 2" class="grid gap-x-6 gap-y-4 md:grid-cols-2">
            <template v-for="(field, i) in fields" :key="field.name ?? i">
                <div v-if="isVisible(field)" :class="spansFullWidth(field) ? 'md:col-span-2' : ''">
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
