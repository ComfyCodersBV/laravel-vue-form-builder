    <script setup lang="ts">
    import { useFormContext } from '@inertiajs/vue3'
    import { inject } from 'vue'
    import { fieldSlotsKey } from '../lib/field-slots'
    import type { Field } from '../types/form-builder'

    import Button from './Fields/Button.vue'
    import CheckboxField from './Fields/CheckboxField.vue'
    import CheckboxesField from './Fields/CheckboxesField.vue'
    import ColorField from './Fields/ColorField.vue'
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
    import RepeaterField from './Fields/RepeaterField.vue'
    import Wysiwyg from './Fields/Wysiwyg.vue';
    import RecaptchaField from './Fields/RecaptchaField.vue'

    const { fields, form: propForm, onFieldChange, fieldOverrides, columns = 1 } = defineProps<{
        fields: Field[]
        form?: any
        onFieldChange?: (field: string, value: any) => void
        fieldOverrides?: Record<string, Partial<Field & Record<string, any>>>
        columns?: 1 | 2
    }>()

    const FULL_WIDTH_TYPES = ['wysiwyg', 'textarea', 'repeater', 'keyvalue', 'submit', 'button', 'delete', 'hidden']

    function spansFullWidth(field: Field): boolean {
        return columns === 1
            || (field as any).fullWidth === true
            || FULL_WIDTH_TYPES.includes(field.type ?? '')
    }

    const form = propForm ?? useFormContext()

    const fieldComponents: Record<string, any> = {
        button: Button,
        checkbox: CheckboxField,
        checkboxes: CheckboxesField,
        color: ColorField,
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
        repeater: RepeaterField,
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

    const fieldSlots = inject(fieldSlotsKey, {})

    function slotFor(field: Field) {
        return (field.name ? fieldSlots[field.name] : undefined) ?? (field.type ? fieldSlots[field.type] : undefined)
    }

    function slotPropsFor(field: Field) {
        const name = field.name ?? ''

        return {
            field,
            form,
            error: form.errors?.[name],
            modelValue: form[name],
            'onUpdate:modelValue': (value: any) => {
                form[name] = value
                onFieldChange?.(name, value)
            },
        }
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
        <div :class="columns === 2 ? 'grid gap-x-6 gap-y-4 md:grid-cols-2' : 'space-y-4'">
        <template v-for="(field, i) in fields" :key="field.name ?? i">
            <div v-if="isVisible(field)" :class="columns === 2 && spansFullWidth(field) ? 'md:col-span-2' : ''">
                <component
                    v-if="slotFor(field)"
                    :is="slotFor(field)"
                    v-bind="slotPropsFor(field)"
                />
                <component
                    v-else-if="componentFor(field)"
                    :is="componentFor(field)"
                    v-bind="{ ...field, ...(fieldOverrides?.[field.name ?? ''] ?? {}) }"
                    v-model="form[field.name]"
                    :error="form.errors[field.name]"
                    @update:modelValue="onFieldChange?.(field.name, $event)"
                />
                <div v-else class="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    Unknown field type: <code class="font-mono">{{ field.type }}</code>
                </div>
            </div>
        </template>
        </div>
    </template>
