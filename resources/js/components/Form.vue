<script setup lang="ts">
import { Form } from '@inertiajs/vue3'
import { reactive } from 'vue'
import FormRenderer from './FormRenderer.vue'
import { FormSchema } from '../types/form-builder'
import { toBoolean } from '@/lib/utils'

const { schema } = defineProps<{ schema: FormSchema }>()

const defaults = schema.defaults ?? {}

const initialValues = Object.fromEntries(
  schema.fields
    .filter((field) => field.name)
    .map((field) => {
      const name = field.name!
      const type = field.type
      const hasPayloadKey = Object.prototype.hasOwnProperty.call(defaults, name)
      const payloadValue = hasPayloadKey ? (defaults as any)[name] : undefined
      const payloadDefined = hasPayloadKey && payloadValue !== undefined && payloadValue !== null && !(typeof payloadValue === 'string' && payloadValue.length === 0)
      const hasFieldDefault = Object.prototype.hasOwnProperty.call(field as any, 'default')
      const fieldDefault = (field as any).default

      if (type === 'checkbox' || type === 'toggle') {
        if (payloadDefined) {
            return [name, toBoolean(payloadValue)]
        }

        return [name, undefined]
      }

      if (type === 'checkboxes') {
        if (payloadDefined && Array.isArray(payloadValue)) {
            return [name, payloadValue]
        }

        if (hasFieldDefault && Array.isArray(fieldDefault)) {
            return [name, fieldDefault]
        }

        return [name, []]
      }

      if (payloadDefined) {
          return [name, payloadValue]
      }

      if (hasFieldDefault) {
          return [name, fieldDefault]
      }

      return [name, '']
    })
)

const values = reactive<Record<string, any>>({ ...initialValues })
</script>

<template>
    <Form
        :id="schema.id"
        :action="schema.action"
        :method="(schema.method || 'POST') as any"
        :class="schema.formClass || ''"
        v-slot="{ errors }"
    >
        <FormRenderer :fields="schema.fields" :values="values" :errors="errors" />
    </Form>
</template>
