<script setup lang="ts">
import { useForm } from '@inertiajs/vue3'
import FormRenderer from './FormRenderer.vue'
import { FormSchema } from '../types/form-builder'

const { schema } = defineProps<{ schema: FormSchema }>()

const emit = defineEmits<{ (e: 'success'): void; (e: 'error'): void }>()

const raw = (schema as any).defaults ?? {}
const formData: Record<string, any> = Array.isArray(raw) ? {} : { ...raw }

schema.fields.forEach((field: any) => {
    if (!field?.name) {
        return
    }

    const hasExplicit = Object.prototype.hasOwnProperty.call(formData, field.name)
    const fieldHasDefault = typeof field.default !== 'undefined' && field.default !== null && field.default !== ''

    if (!hasExplicit) {
        if (fieldHasDefault) {
            formData[field.name] = field.default
        } else if (field.multiple === true) {
            formData[field.name] = []
        } else {
            formData[field.name] = ''
        }
    }
})

const form = useForm(formData)

const submitForm = () => {
    const method = (schema.method ?? 'post').toLowerCase()
    const opts = { onSuccess: () => emit('success'), onError: () => emit('error') }

    if (method === 'get') {
        return (form as any).get(schema.action, opts)
    }

    if (['post', 'put', 'patch', 'delete'].includes(method)) {
        return (form as any)[method].call(form, schema.action, opts)
    }

    return (form as any).post(schema.action, opts)
}
</script>

<template>
    <form
        :id="schema.id"
        :class="schema.formClass || ''"
        @submit.prevent="submitForm"
    >
        <FormRenderer :fields="schema.fields" :form="form" />
    </form>
</template>
