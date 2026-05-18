    <script setup lang="ts">
    import { useFormContext } from '@inertiajs/vue3'
    import type { Field } from '../types/form-builder'

    import Button from './Fields/Button.vue'
    import CheckboxField from './Fields/CheckboxField.vue'
    import CheckboxesField from './Fields/CheckboxesField.vue'
    import DateField from './Fields/DateField.vue'
    import DeleteButtonField from './Fields/DeleteButtonField.vue'
    import HiddenField from './Fields/HiddenField.vue'
    import NumberField from './Fields/NumberField.vue'
    import RadioGroupField from './Fields/RadioGroupField.vue'
    import SelectField from './Fields/SelectField.vue'
    import SubmitButton from './Fields/SubmitButton.vue'
    import TextField from './Fields/TextField.vue'
    import TextareaField from './Fields/TextareaField.vue'
    import ToggleField from './Fields/ToggleField.vue'
    import FileField from './Fields/FileField.vue';
    import KeyValueField from './Fields/KeyValueField.vue'
    import Wysiwyg from './Fields/Wysiwyg.vue';
    import RecaptchaField from './Fields/RecaptchaField.vue'

    const { fields, form: propForm, onFieldChange, fieldOverrides } = defineProps<{
        fields: Field[]
        form?: any
        onFieldChange?: (field: string, value: any) => void
        fieldOverrides?: Record<string, Partial<Field & Record<string, any>>>
    }>()

    const form = propForm ?? useFormContext()

    const fieldComponents: Record<string, any> = {
        button: Button,
        checkbox: CheckboxField,
        checkboxes: CheckboxesField,
        color: TextField,
        date: DateField,
        delete: DeleteButtonField,
        email: TextField,
        file: FileField,
        hidden: HiddenField,
        keyvalue: KeyValueField,
        number: NumberField,
        password: TextField,
        radio: RadioGroupField,
        recaptcha: RecaptchaField,
        select: SelectField,
        submit: SubmitButton,
        text: TextField,
        textarea: TextareaField,
        toggle: ToggleField,
        wysiwyg: Wysiwyg,
    }

    function componentFor(field: Field) {
        return field.type ? fieldComponents[field.type] : undefined
    }

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
        <template v-for="(field, i) in fields" :key="field.name ?? i">
            <template v-if="isVisible(field)">
                <component
                    v-if="componentFor(field)"
                    :is="componentFor(field)"
                    v-bind="{ ...field, ...(fieldOverrides?.[field.name ?? ''] ?? {}) }"
                    v-model="form[field.name]"
                    :error="form.errors[field.name]"
                    @update:modelValue="onFieldChange?.(field.name, $event)"
                />
                <div v-else class="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    Unknown field type: <code class="font-mono">{{ field.type }}</code>
                </div>
            </template>
        </template>
    </template>
