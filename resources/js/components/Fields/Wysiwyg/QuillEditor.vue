<script setup lang="ts">
import { onMounted, shallowRef, watch, nextTick } from 'vue'
import { QuillyEditor } from 'vue-quilly'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import type { Field } from '../../../types/form-builder'

if (typeof window !== 'undefined') {
    (window as any).Quill = Quill
}

const editor = shallowRef<InstanceType<typeof QuillyEditor>>()
const quill = shallowRef<Quill | null>(null)
const isUpdating = shallowRef(false)

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const props = withDefaults(defineProps<{ modelValue: string } & Field>(), {
    modelValue: '',
})

const options = shallowRef(props.options)

function normalizeHtml(html: string) {
    const lines = html.split(/\n\n+/)
    return lines.map(line => {
        const trimmed = line.trim()
        if (!trimmed) {
            return ''
        }

        if (/^<(p|div|ul|ol|li|h[1-6]|hr|blockquote|pre)/i.test(trimmed)) {
            return trimmed
        }

        return `<p>${trimmed}</p>`
    }).join('\n')
}

onMounted(async () => {
    if ((window as any).Quill?.imports?.parchment) {
        (window as any).Quill.imports.parchment.Attributor.Style =
            (window as any).Quill.imports.parchment.StyleAttributor
    }

    try {
        await import('quill-image-resize-module')
    } catch (e) {
        console.warn('quill-image-resize-module could not be loaded:', e)
    }

    if (!editor.value) {
        return
    }

    quill.value = editor.value.initialize((window as any).Quill)

    await nextTick()

    const initial = props.modelValue || ''
    if (initial) {
        const needsNormalization = initial.indexOf('<p>') === -1 && initial.indexOf('<div>') === -1
        const html = needsNormalization ? normalizeHtml(initial) : initial
        quill.value.clipboard.dangerouslyPasteHTML(0, html, 'silent')
    }
    quill.value.setSelection(0, 0, 'silent')

    quill.value.on('text-change', (delta, oldDelta, source) => {
        if (source === 'user' && !isUpdating.value) {
            const html = typeof quill.value.getSemanticHTML === 'function'
                ? quill.value.getSemanticHTML()
                : quill.value.root.innerHTML
            emit('update:modelValue', html)
        }
    })
})

watch(
    () => props.modelValue,
    (val) => {
        if (!quill.value || isUpdating.value) {
            return
        }

        const currentHtml = typeof quill.value.getSemanticHTML === 'function'
            ? quill.value.getSemanticHTML()
            : quill.value.root.innerHTML

        if (currentHtml !== (val || '')) {
            isUpdating.value = true

            const sel = quill.value.getSelection()
            quill.value.clipboard.dangerouslyPasteHTML(0, val || '', 'silent')

            if (sel) {
                try {
                    quill.value.setSelection(sel.index, sel.length, 'silent')
                } catch (e) {
                    //
                }
            }

            setTimeout(() => {
                isUpdating.value = false
            }, 0)
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
