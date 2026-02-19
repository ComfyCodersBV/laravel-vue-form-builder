<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { QuillyEditor } from 'vue-quilly'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import type { Field } from '../../../types/form-builder'

const editor = ref()
const quill = ref<Quill>()

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const props = withDefaults(defineProps<{ modelValue: string } & Field>(), {
    modelValue: '',
})

const options = ref(props.options)

onMounted(() => {
    if (!editor.value) {
        return
    }

    quill.value = editor.value.initialize(Quill)
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
