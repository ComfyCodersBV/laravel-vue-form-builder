<script setup lang="ts">
import { Jodit } from 'jodit'
import 'jodit/es2021/jodit.min.css'
import { onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'
import type { WysiwygAdapterProps } from './types'

/**
 * Jodit — MIT core only. `jodit-pro` and the OEM builds are out of scope.
 *
 * Written straight against the engine API, because Jodit is dependency-free
 * vanilla TypeScript and needs no Vue wrapper package. Nothing else in this
 * package imports this file.
 */
const props = withDefaults(defineProps<WysiwygAdapterProps>(), {
    modelValue: '',
    config: () => ({}),
})

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const element = shallowRef<HTMLTextAreaElement | null>(null)
const editor = shallowRef<Jodit | null>(null)
const isApplyingModelValue = shallowRef(false)

onMounted(() => {
    if (!element.value) {
        return
    }

    editor.value = Jodit.make(element.value, {
        placeholder: props.placeholder,
        ...props.config,
    })

    editor.value.value = props.modelValue ?? ''
    applyDisabled(props.disabled === true)

    editor.value.events.on('change', (value: string) => {
        if (isApplyingModelValue.value) {
            return
        }

        emit('update:modelValue', value)
    })
})

onBeforeUnmount(() => {
    editor.value?.destruct()
    editor.value = null
})

/**
 * Writing `value` fires `change` again, so the guard stops the editor from
 * echoing a value the parent just handed it back as a fresh edit.
 */
watch(
    () => props.modelValue,
    (value) => {
        const incoming = value ?? ''

        if (!editor.value || editor.value.value === incoming) {
            return
        }

        isApplyingModelValue.value = true
        editor.value.value = incoming
        isApplyingModelValue.value = false
    },
)

watch(() => props.disabled, (disabled) => applyDisabled(disabled === true))

function applyDisabled(disabled: boolean): void {
    editor.value?.setDisabled(disabled)
}
</script>

<template>
    <textarea ref="element"></textarea>
</template>
