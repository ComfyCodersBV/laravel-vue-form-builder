<script setup lang="ts">
import BaseField from './BaseField.vue';
import { computed, defineAsyncComponent } from 'vue';
import type { Field } from '../../types/form-builder';
import {Textarea} from "../ui/textarea";

const QuillEditor = defineAsyncComponent({
    loader: async () => {
        try {
            const mod = await import('./Wysiwyg/QuillEditor.vue')
            return mod.default
        } catch (e) {
            const fallback = await import('./Wysiwyg/TextareaEditor.vue')
            return fallback.default
        }
    },
    suspensible: false,
})

interface Props extends Field {
    name: string
    editor: string
    options?: any
}

const props = withDefaults(defineProps<Props>(), {
    label: undefined,
    placeholder: '',
    modelValue: '',
    error: undefined,
    disabled: false,
    readonly: false,
    editor: '',
    options: {},
})

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const model = computed<string>({
    get: () => (props.modelValue as any) ?? '',
    set: (v) => emit('update:modelValue', v),
})
</script>

<template>
    <BaseField :label="props.label" :name="props.name" :error="props.error" :help="props.help">
        <input type="hidden" :name="props.name" :value="model" />

        <QuillEditor
            v-if="props.editor === 'quill'"
            v-bind="props"
            v-model:modelValue="model"
        />

        <template v-else>
            <Textarea
                v-model="model"
                :placeholder="placeholder"
                :disabled="disabled"
                :readonly="readonly"
                :class="className"
            />
            <div class="mx-auto my-1 w-fit rounded border border-red-200 bg-red-50 p-1 text-sm text-red-700">
                Unknown wysiwyg editor: <code class="font-mono">{{ props.editor }}</code>
            </div>
        </template>
    </BaseField>
</template>
