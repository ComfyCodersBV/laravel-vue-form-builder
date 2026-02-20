<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { QuillyEditor } from 'vue-quilly'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import type { Field } from '../../../types/form-builder'

if (typeof window !== 'undefined') {
    (window as any).Quill = Quill
}

const editor = ref()
const quill = ref<Quill>()

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const props = withDefaults(defineProps<{ modelValue: string } & Field>(), {
    modelValue: '',
})

const options = ref(props.options)

onMounted(async () => {
    if ((window as any).Quill?.imports?.parchment) {
        (window as any).Quill.imports.parchment.Attributor.Style = (window as any).Quill.imports.parchment.StyleAttributor
    }

    try {
        await import('quill-image-resize-module')
        console.log('quill-image-resize-module loaded successfully')
    } catch (e) {
        console.warn('quill-image-resize-module could not be loaded:', e)
    }

    if (!editor.value) {
        return
    }

    quill.value = editor.value.initialize((window as any).Quill)
    quill.value.root.innerHTML = props.modelValue || ''

    quill.value.on('text-change', () => {
        emit('update:modelValue', quill.value?.root.innerHTML || '')
    })
})

watch(
    () => props.modelValue,
    (val) => {
        if (quill.value && quill.value.root.innerHTML !== (val || '')) {
            quill.value.root.innerHTML = val || ''
        }
    }
)
</script>

<template>
    <div class="quill-wrapper">
        <QuillyEditor
            ref="editor"
            :options="options"
        />
    </div>
</template>

<style>
.quill-wrapper .ql-toolbar {
    border-radius: 0.5rem 0.5rem 0 0;
}

.quill-wrapper .ql-container {
    border-radius: 0 0 0.5rem 0.5rem;
}
</style>
