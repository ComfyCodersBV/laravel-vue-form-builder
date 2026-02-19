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
    import Wysiwyg from "./Fields/Wysiwyg.vue";

    const { fields, form: propForm } = defineProps<{ fields: Field[], form?: any }>()

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
    </script>

    <template>
        <div class="space-y-4">
            <template v-for="(field, i) in fields" :key="field.name ?? i">
                <component
                    v-if="componentFor(field)"
                    :is="componentFor(field)"
                    v-bind="field"
                    v-model="form[field.name]"
                    :error="form.errors[field.name]"
                />
                <div v-else class="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    Unknown field type: <code class="font-mono">{{ field.type }}</code>
                </div>
            </template>
        </div>
    </template>
