<script setup lang="ts">
import { computed, inject, ref } from 'vue';
import { router } from '@inertiajs/vue3';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { useFieldListeners } from '../../lib/listeners';
import { buttonEventKey } from '../../lib/button-events';
import { conditionData, expressionHolds, expressionValue, formValues } from '../../lib/conditions';
import { formFieldsKey } from '../../lib/fields';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../ui/dialog';

interface Props {
    className?: string
    inputClassName?: string
    name?: string
    label?: string
    labelHtml?: string
    ariaLabel?: string
    cancelLabel?: string
    confirmTitle?: string
    confirmMessage?: string
    deleteUrl?: string
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
    type?: 'button' | 'submit'
    disabled?: boolean | string
    labelExpression?: string
    disabledIf?: string
    emit?: string
    form?: any
}

const props = withDefaults(defineProps<Props>(), {
    className: undefined,
    inputClassName: undefined,
    name: undefined,
    label: '',
    labelHtml: undefined,
    ariaLabel: undefined,
    cancelLabel: undefined,
    confirmTitle: undefined,
    confirmMessage: undefined,
    deleteUrl: undefined,
    variant: 'default',
    type: 'button',
    disabled: undefined,
    labelExpression: undefined,
    disabledIf: undefined,
    emit: undefined,
    form: undefined,
})

const testId = computed(() => props.name ? `field-${props.name}` : undefined)

const emit = defineEmits<{
    confirm: []
}>()

const hasConfirm = computed(() => !!props.confirmTitle || !!props.confirmMessage)

const formFields = inject(formFieldsKey, [])

const expressionData = computed(() => conditionData(formValues(props.form), formFields))

const shownLabel = computed(() => {
    const computedLabel = props.labelExpression && props.form ? expressionValue(props.labelExpression, expressionData.value) : ''

    return computedLabel || props.label
})

const isDisabled = computed(() => {
    if (props.disabled === true || (typeof props.disabled === 'string' && props.disabled !== '')) {
        return true
    }

    if (!props.disabledIf) {
        return false
    }

    return props.form ? expressionHolds(props.disabledIf, expressionData.value, true) : true
})

const emitButtonEvent = inject(buttonEventKey, undefined)

function announce(): void {
    if (props.emit && props.type !== 'submit' && !props.deleteUrl) {
        emitButtonEvent?.(props.emit, props.name, props.form)
    }
}

const showDialog = ref(false)
const hiddenSubmit = ref<HTMLButtonElement | null>(null)

function handleConfirmAction() {
    if (props.deleteUrl) {
        router.delete(props.deleteUrl, {
            onSuccess: () => {
                showDialog.value = false;
            },
        });

        return;
    }

    if (props.type === 'submit') {
        hiddenSubmit.value?.click();
        showDialog.value = false;

        return;
    }

    emit('confirm');
    announce();
    showDialog.value = false;
}

defineOptions({ inheritAttrs: false })

const { listeners } = useFieldListeners()
</script>

<template>
    <template v-if="hasConfirm">
        <button v-if="type === 'submit'" ref="hiddenSubmit" type="submit" class="hidden" />
        <Dialog v-model:open="showDialog">
            <DialogTrigger as-child>
                <Button
                    v-bind="listeners()"
                    :variant="variant"
                    type="button"
                    :disabled="isDisabled"
                    :data-testid="testId"
                    :class="cn('inline-flex items-center rounded px-4 py-2 text-sm font-medium', className, inputClassName)"
                    :aria-label="ariaLabel"
                >
                    <span v-if="labelHtml" class="inline-flex items-center gap-1.5" v-html="labelHtml" />
                    <template v-else>{{ shownLabel }}</template>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{{ confirmTitle }}</DialogTitle>
                    <DialogDescription>
                        {{ confirmMessage }}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter class="gap-2">
                    <DialogClose as-child>
                        <Button variant="outline" type="button">
                            {{ cancelLabel }}
                        </Button>
                    </DialogClose>
                    <Button
                        :variant="variant"
                        type="button"
                        :data-testid="testId ? `${testId}-confirm` : undefined"
                        @click="handleConfirmAction"
                    >
                        {{ shownLabel || ariaLabel }}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </template>
    <template v-else>
        <Button
            v-bind="$attrs"
            :variant="variant"
            :type="type"
            :disabled="isDisabled"
            :data-testid="testId"
            :class="cn('inline-flex items-center rounded px-4 py-2 text-sm font-medium', className, inputClassName)"
            :aria-label="ariaLabel"
            @click="announce"
        >
            <span v-if="labelHtml" class="inline-flex items-center gap-1.5" v-html="labelHtml" />
            <template v-else>{{ shownLabel }}</template>
        </Button>
    </template>
</template>
