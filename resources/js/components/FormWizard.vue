<script setup lang="ts">
import { Check } from '@lucide/vue'
import { computed, nextTick, ref, watch } from 'vue'
import FormRenderer from './FormRenderer.vue'
import { Button } from './ui/button'
import { conditionData, formValues, meetsCondition, visibleValueFields } from '../lib/conditions'
import { flattenFields } from '../lib/fields'
import { normalizeColumns, type FormColumns } from '../lib/layout'
import { useFormMessages } from '../lib/messages'
import type { StepValidation } from '../lib/precognition'
import type { Field } from '../types/form-builder'

const props = defineProps<{
    steps: Field[]
    extraFields: Field[]
    allFields: Field[]
    form: any
    submitLabel?: string
    columns?: FormColumns
    onFieldChange?: (field: string, value: any) => void
    fieldOverrides?: Record<string, Partial<Field & Record<string, any>>>
    validateStep?: (fields: string[]) => Promise<StepValidation>
    initialStep?: string
}>()

const emit = defineEmits<{ (e: 'step-change', name: string | undefined): void }>()

const messageContext = useFormMessages()
const messages = computed(() => messageContext.value.messages)

const data = computed(() => conditionData(formValues(props.form), props.allFields))

function hasVisibleContent(step: Field): boolean {
    return visibleValueFields(step.fields ?? [], data.value).some((field) => field.type !== 'hidden')
}

const visibleSteps = computed(() => props.steps.filter((step) => meetsCondition(step, data.value) && hasVisibleContent(step)))

const currentName = ref<string | undefined>(
    props.steps.some((step) => step.name === props.initialStep) ? props.initialStep : props.steps[0]?.name,
)
const checking = ref(false)
const stepError = ref<string | null>(null)
const heading = ref<HTMLElement | null>(null)

const currentIndex = computed(() => Math.max(0, visibleSteps.value.findIndex((step) => step.name === currentName.value)))
const current = computed(() => visibleSteps.value[currentIndex.value])

watch(() => current.value?.name, (name) => emit('step-change', name))

const isLast = computed(() => currentIndex.value >= visibleSteps.value.length - 1)
const stepColumns = computed((): FormColumns => normalizeColumns(current.value?.columns ?? props.columns ?? 1))

const progressLabel = computed(() => messages.value.stepOf
    .replace(':current', String(currentIndex.value + 1))
    .replace(':total', String(visibleSteps.value.length)))

function stepFieldNames(step: Field | undefined): string[] {
    if (!step) {
        return []
    }

    return flattenFields(step.fields ?? [])
        .map((field) => field.name)
        .filter((name): name is string => typeof name === 'string' && name !== '')
}

function hasErrors(step: Field): boolean {
    const errors = props.form.errors ?? {}

    return stepFieldNames(step).some((name) => Object.keys(errors).some((key) => key === name || key.startsWith(`${name}.`)))
}

async function goTo(index: number): Promise<void> {
    const step = visibleSteps.value[index]

    if (!step) {
        return
    }

    currentName.value = step.name
    stepError.value = null

    await nextTick()
    heading.value?.focus({ preventScroll: true })
    heading.value?.scrollIntoView?.({ block: 'start', behavior: 'smooth' })
}

function setErrors(errors: Record<string, string>): void {
    if (typeof props.form.setError === 'function') {
        props.form.setError(errors)

        return
    }

    Object.assign(props.form.errors, errors)
}

async function next(): Promise<void> {
    if (isLast.value || checking.value) {
        return
    }

    const names = visibleValueFields(current.value?.fields ?? [], data.value)
        .filter((field) => field.type !== 'file')
        .map((field) => field.name as string)

    props.form.clearErrors?.(...stepFieldNames(current.value))
    stepError.value = null

    if (props.validateStep && names.length > 0) {
        checking.value = true
        const result = await props.validateStep(names)
        checking.value = false

        if (result.status === 'invalid') {
            setErrors(result.errors)

            return
        }

        if (result.status === 'failed') {
            stepError.value = messages.value.stepCheckFailed

            return
        }
    }

    await goTo(currentIndex.value + 1)
}

function previous(): void {
    void goTo(currentIndex.value - 1)
}

function jumpTo(index: number): void {
    if (index < currentIndex.value) {
        void goTo(index)
    }
}

async function jumpToFirstError(): Promise<void> {
    await nextTick()

    if (!current.value || hasErrors(current.value)) {
        return
    }

    const index = visibleSteps.value.findIndex((step) => hasErrors(step))

    if (index >= 0) {
        await goTo(index)
    }
}

defineExpose({ next, previous, jumpToFirstError, isLast, currentIndex })
</script>

<template>
    <div class="space-y-6" data-form-wizard>
        <nav :aria-label="progressLabel" class="space-y-2">
            <p class="text-sm font-medium text-neutral-500 dark:text-neutral-400" data-step-progress>{{ progressLabel }}</p>
            <ol class="grid gap-2" :style="{ gridTemplateColumns: `repeat(${visibleSteps.length}, minmax(0, 1fr))` }">
                <li
                    v-for="(step, index) in visibleSteps"
                    :key="step.name ?? index"
                    class="flex min-w-0 items-center justify-center gap-2 sm:justify-start"
                    :data-step-item="step.name"
                >
                    <button
                        type="button"
                        class="flex size-10 shrink-0 items-center justify-center rounded-full border-2 text-base font-semibold"
                        :class="[
                            index === currentIndex ? 'border-primary bg-primary text-primary-foreground' : '',
                            index < currentIndex ? 'cursor-pointer border-primary text-primary' : '',
                            index > currentIndex ? 'cursor-default border-neutral-300 text-neutral-500 dark:border-neutral-600 dark:text-neutral-400' : '',
                            hasErrors(step) && index !== currentIndex ? 'border-red-500 text-red-600' : '',
                        ]"
                        :aria-current="index === currentIndex ? 'step' : undefined"
                        :aria-label="`${messages.step} ${index + 1}: ${step.title ?? ''}`"
                        :disabled="index > currentIndex"
                        :data-step-indicator="step.name"
                        @click="jumpTo(index)"
                    >
                        <Check v-if="index < currentIndex && !hasErrors(step)" class="size-5" />
                        <span v-else>{{ index + 1 }}</span>
                    </button>
                    <span class="hidden min-w-0 sm:block" aria-hidden="true">
                        <span
                            class="line-clamp-2 text-sm leading-tight break-words"
                            :class="index === currentIndex ? 'font-semibold text-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-400'"
                            :title="step.title"
                            data-step-title
                        >
                            {{ step.title }}
                        </span>
                    </span>
                </li>
            </ol>
        </nav>

        <section v-if="current" :key="current.name" class="space-y-4" :data-step="current.name">
            <header class="space-y-1">
                <h2 ref="heading" tabindex="-1" class="scroll-mt-4 text-xl font-semibold text-neutral-900 outline-none dark:text-neutral-100">
                    {{ current.title }}
                </h2>
                <div v-if="current.description" class="text-base text-neutral-500 dark:text-neutral-400" v-html="current.description" />
            </header>

            <slot :name="`step-${current.name}-before`" :form="form" :step="current" />

            <FormRenderer
                :fields="current.fields ?? []"
                :form="form"
                :columns="stepColumns"
                :on-field-change="onFieldChange"
                :field-overrides="fieldOverrides"
            />

            <slot :name="`step-${current.name}-after`" :form="form" :step="current" />

            <FormRenderer
                v-if="isLast && extraFields.length > 0"
                :fields="extraFields"
                :form="form"
                :on-field-change="onFieldChange"
                :field-overrides="fieldOverrides"
            />
        </section>

        <p v-if="stepError" role="alert" class="text-base text-red-600 dark:text-red-400" data-step-error>{{ stepError }}</p>

        <div class="flex gap-3">
            <Button
                v-if="currentIndex > 0"
                type="button"
                variant="outline"
                class="h-12 flex-1 text-base"
                data-step-previous
                @click="previous"
            >
                {{ messages.previousStep }}
            </Button>
            <Button
                v-if="!isLast"
                type="button"
                class="h-12 flex-1 text-base"
                :disabled="checking"
                data-step-next
                @click="next"
            >
                {{ checking ? messages.checkingStep : messages.nextStep }}
            </Button>
            <Button
                v-else
                type="submit"
                class="h-12 flex-1 text-base"
                :disabled="!!form.processing"
                data-step-submit
            >
                {{ submitLabel ?? messages.save }}
            </Button>
        </div>
    </div>
</template>
