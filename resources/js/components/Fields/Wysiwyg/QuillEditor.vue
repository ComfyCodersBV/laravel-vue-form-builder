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
const isSourceMode = shallowRef(false)

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
        if (source === 'user' && !isUpdating.value && !isSourceMode.value) {
            const html = typeof quill.value.getSemanticHTML === 'function'
                ? quill.value.getSemanticHTML()
                : quill.value.root.innerHTML
            emit('update:modelValue', html)
        }
    })

    if (props.options?.showSourceButton !== false) {
        addSourceButton()
    }
})

function addSourceButton() {
    if (!quill.value) {
        return
    }

    const toolbar = quill.value.getModule('toolbar')
    if (!toolbar || !toolbar.container) {
        return
    }

    const btn = document.createElement('button')
    btn.innerHTML = '<svg viewBox="0 0 18 18"><polyline class="ql-stroke" points="5 7 3 9 5 11"></polyline><polyline class="ql-stroke" points="13 7 15 9 13 11"></polyline><line class="ql-stroke" x1="10" x2="8" y1="5" y2="13"></line></svg>'
    btn.title = 'Edit HTML Source'
    btn.className = 'ql-source-btn'
    btn.onclick = (e) => {
        e.preventDefault()
        toggleSourceMode()
    }

    toolbar.container.appendChild(btn)
}

function toggleSourceMode() {
    if (!quill.value) return

    isSourceMode.value = !isSourceMode.value

    const container = quill.value.root.parentElement
    if (!container) return

    if (isSourceMode.value) {
        const scrollTop = quill.value.root.scrollTop

        let html = typeof quill.value.getSemanticHTML === 'function'
            ? quill.value.getSemanticHTML()
            : quill.value.root.innerHTML

        html = html.replace(/&nbsp;/g, ' ')

        const editorHeight = quill.value.root.offsetHeight

        const textarea = document.createElement('textarea')
        textarea.value = html
        textarea.className = 'ql-source-editor'
        textarea.style.cssText = `width: 100%; height: ${editorHeight}px; font-family: monospace; font-size: 13px; border: none; padding: 12px; box-sizing: border-box; resize: none; overflow-y: auto;`

        textarea.dataset.scrollTop = String(scrollTop)

        textarea.addEventListener('input', () => {
            emit('update:modelValue', textarea.value)
        })

        quill.value.root.style.display = 'none'
        container.appendChild(textarea)

        setTimeout(() => {
            textarea.scrollTop = scrollTop
        }, 0)
    } else {
        const textarea = container.querySelector('.ql-source-editor') as HTMLTextAreaElement
        if (textarea) {
            let html = textarea.value
            const savedScrollTop = parseInt(textarea.dataset.scrollTop || '0')

            quill.value.setText('', 'silent')
            quill.value.clipboard.dangerouslyPasteHTML(0, html, 'silent')

            textarea.remove()
            quill.value.root.style.display = ''

            setTimeout(() => {
                if (quill.value) {
                    quill.value.root.scrollTop = savedScrollTop
                }
            }, 0)

            let outputHtml = typeof quill.value.getSemanticHTML === 'function'
                ? quill.value.getSemanticHTML()
                : quill.value.root.innerHTML

            outputHtml = outputHtml.replace(/&nbsp;/g, ' ')
            emit('update:modelValue', outputHtml)
        }
    }
}

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
    position: relative;
}

.quill-wrapper .ql-toolbar .ql-source-btn {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
}

.quill-wrapper .ql-container {
    border-radius: 0 0 0.5rem 0.5rem;
}
</style>
