<script setup lang="ts">
import type { Field } from '../../types/form-builder'
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useRecaptcha } from '../../composables/useRecaptcha'

interface RecaptchaFieldProps extends Field {
    action?: string
    siteKey?: string
}

const props = withDefaults(defineProps<RecaptchaFieldProps>(), {
    action: 'submit',
    error: undefined,
    modelValue: '',
    name: 'g-recaptcha-response',
    siteKey: '',
})

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const model = computed<string>({
    get: () => (props.modelValue as string) ?? '',
    set: (v) => emit('update:modelValue', v),
})

const { execute, isLoaded } = useRecaptcha({
    siteKey: props.siteKey,
    action: props.action,
})

let formElement: HTMLFormElement | null = null
let submitHandler: ((e: Event) => void) | null = null

onMounted(() => {
    const inputElement = document.getElementById(props.name || 'g-recaptcha-response')
    formElement = inputElement?.closest('form') ?? null

    if (!formElement) {
        console.warn('reCAPTCHA field: parent form not found')
        return
    }

    if (!isLoaded()) {
        console.warn('reCAPTCHA field: grecaptcha not loaded')
        return
    }

    submitHandler = async (e: Event) => {
        e.preventDefault()

        const token = await execute()

        if (token) {
            model.value = token
        }

        if (formElement && submitHandler) {
            formElement.removeEventListener('submit', submitHandler)
        }

        formElement?.requestSubmit()

        setTimeout(() => {
            if (formElement && submitHandler) {
                formElement.addEventListener('submit', submitHandler)
            }
        }, 0)
    }

    formElement.addEventListener('submit', submitHandler)
})

onBeforeUnmount(() => {
    if (formElement && submitHandler) {
        formElement.removeEventListener('submit', submitHandler)
    }
})
</script>

<template>
    <div>
        <input type="hidden" :name="name" :id="name" v-model="model" />
        <p v-if="error" class="text-sm text-red-600">
            <span v-if="Array.isArray(error)">{{ error[0] }}</span>
            <span v-else>{{ error }}</span>
        </p>
    </div>
</template>
