<script setup lang="ts">
import { useForm } from '@inertiajs/vue3'
import FormRenderer from './FormRenderer.vue'
import { FormSchema } from '../types/form-builder'

const { schema } = defineProps<{ schema: FormSchema }>()

const formData = schema.defaults ?? {}

schema.fields.forEach(field => {
    if (!(field.name in formData)) {
        formData[field.name] = ''
    }
})

const form = useForm(formData)

const submitForm = () => {
    const method = (schema.method ?? 'post').toLowerCase()

    if (method === 'get') {
        return form.get(schema.action, { params: form.data })
    }

    if (['post', 'put', 'patch', 'delete'].includes(method)) {
        return (form as any)[method].call(form, schema.action)
    }

    return form.post(schema.action)
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
