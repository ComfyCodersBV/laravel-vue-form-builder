<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { QuillyEditor } from 'vue-quilly'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import { Field } from "../../../types/form-builder";

window.Quill = Quill

const editor = ref<InstanceType<typeof QuillyEditor>>()

let quill: Quill | undefined

const props = withDefaults(defineProps<{ modelValue: string } & Field>(), {
    modelValue: '',
    placeholder: '',
    readonly: false,
    disabled: false,
})

const options = ref(props.options)

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const model = computed({
    get: () => props.modelValue,
    set: (v) => emit('update:modelValue', v),
})

onMounted(async () => {
    if (! editor.value) {
        return
    }

    window.Quill.imports.parchment.Attributor.Style = window.Quill.imports.parchment.StyleAttributor

    await import('quill-image-resize-module')

    quill = editor.value.initialize(window.Quill)

    quill.root.innerHTML = model.value

    quill.on('text-change', () => {
        model.value = quill!.root.innerHTML
    })
})
</script>

<template>
    <div class="quill-wrapper">
        <QuillyEditor
            ref="editor"
            v-model="model"
            :options="options"
        />
    </div>
</template>
