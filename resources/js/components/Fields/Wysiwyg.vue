<script setup lang="ts">
import BaseField from './BaseField.vue';
import TextareaEditor from '../../wysiwyg/TextareaEditor.vue';
import { computed, watch } from 'vue';
import type { Field } from '../../types/form-builder';
import { registeredWysiwygEditors, resolveWysiwygEditor } from '../../wysiwyg/registry';

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

const editorComponent = computed(() => resolveWysiwygEditor(props.editor))

const isUnregistered = computed(() => ! editorComponent.value && props.editor !== '' && props.editor !== 'textarea')

const isDevelopment = import.meta.env.DEV

const showsUnregisteredNotice = computed(() => isDevelopment && isUnregistered.value)

const warnAboutUnregisteredEditor = (): void => {
    if (! isDevelopment || ! isUnregistered.value) {
        return
    }

    console.warn(
        `[form-builder] No WYSIWYG editor registered under the key "${props.editor}", falling back to a textarea. `
        + `Registered keys: ${JSON.stringify(registeredWysiwygEditors())}. `
        + `Register it in your app entrypoint: registerWysiwygEditor('${props.editor}', SomeEditor).`,
    )
}

watch(() => props.editor, warnAboutUnregisteredEditor, { immediate: true })
</script>

<template>
    <BaseField :label="props.label" :name="props.name" :error="props.error" :help="props.help">
        <input type="hidden" :name="props.name" :value="model" />

        <component
            :is="editorComponent"
            v-if="editorComponent"
            v-model:model-value="model"
            :placeholder="props.placeholder"
            :disabled="props.disabled"
            :config="props.options"
        />

        <template v-else>
            <TextareaEditor
                v-model:model-value="model"
                :placeholder="props.placeholder"
                :disabled="props.disabled"
                :readonly="props.readonly"
                :class-name="props.className"
            />

            <div
                v-if="showsUnregisteredNotice"
                class="mx-auto my-1 w-fit rounded border border-amber-200 bg-amber-50 p-1 text-sm text-amber-800"
            >
                No WYSIWYG editor registered for <code class="font-mono">{{ props.editor }}</code> — showing a textarea.
            </div>
        </template>
    </BaseField>
</template>
