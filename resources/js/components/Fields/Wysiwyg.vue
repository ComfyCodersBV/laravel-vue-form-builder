<script setup lang="ts">
import BaseField from './BaseField.vue';
import { computed } from 'vue';
import type { Field } from '../../types/form-builder';
import QuillEditor from "./Wysiwyg/QuillEditor.vue";
import { Textarea } from "../ui/textarea";

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
            v-model="model"
        />

        <template v-else>
            <Textarea
                :id="props.name"
                :name="props.name"
                :disabled="props.disabled"
                :readonly="props.readonly"
                :placeholder="props.placeholder"
                v-model="model"
                class="flex-1 dark:text-neutral-100"
                rows="4"
            />
            <div class="mx-auto my-1 w-fit rounded border border-red-200 bg-red-50 p-1 text-sm text-red-700">
                Unknown wysiwyg editor: <code class="font-mono">{{ props.editor }}</code>
            </div>
        </template>
    </BaseField>
</template>
