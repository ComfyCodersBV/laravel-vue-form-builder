# WYSIWYG Adapters

The [WYSIWYG field](wysiwyg) resolves its editor through a runtime registry. An adapter is a plain Vue component that wraps one engine and is imported by nothing inside this package — that is what keeps the engine out of every consumer's bundle.

## The contract

```ts
export interface WysiwygAdapterProps {
    modelValue: string;
    disabled?: boolean;
    placeholder?: string;
    config?: Record<string, unknown>;
    uploadUrl?: string;
}
```

An adapter:

- accepts those props and nothing engine-specific beyond them
- emits `update:modelValue` with an **HTML string**
- treats `config` as an opaque blob it may interpret however its engine requires

`config` is whatever `Wysiwyg::options()` was given on the PHP side. Nothing between the field definition and your adapter reads or validates it, because its shape belongs to the engine.

No Delta, no ProseMirror document, no editor instance leaks through the props. HTML in, HTML out, so a form can switch engines without touching stored data.

## Registering

```ts
import { registerWysiwygEditor } from '@form-builder/wysiwyg/registry';
import MyEditor from './MyEditor.vue';

registerWysiwygEditor('my-editor', MyEditor);
```

Then `Wysiwyg::make('content')->editor('my-editor')`.

Helpers on the registry:

| Function | Purpose |
|---|---|
| `registerWysiwygEditor(key, component)` | make an editor available under a key |
| `resolveWysiwygEditor(key)` | the component, or `undefined` |
| `registeredWysiwygEditors()` | every registered key, handy when debugging a stray textarea |

## Skeleton

```vue
<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import type { WysiwygAdapterProps } from '@form-builder/wysiwyg/types';

const props = withDefaults(defineProps<WysiwygAdapterProps>(), {
    modelValue: '',
    config: () => ({}),
});

const emit = defineEmits<{ 'update:modelValue': [string] }>();

const element = ref<HTMLDivElement>();

onMounted(() => {
    // create the engine on element.value, seed it with props.modelValue,
    // and emit update:modelValue with HTML whenever the user types
});

watch(() => props.modelValue, () => {
    // push external changes into the engine, guarding against echoing your own emit
});
</script>

<template>
    <div ref="element" />
</template>
```

Two details worth copying from the bundled Quill adapter: guard the `watch` with a flag so your own emit does not loop, and compare the engine's current HTML against the incoming value before rewriting the document — rewriting on every keystroke destroys the caret.

## Licensing

Only permissively licensed engines ship as first-party adapters. That is a deliberate boundary: a maintained adapter is an invitation, and for a copyleft engine that invitation would steer applications into inheriting GPL obligations, turning this documentation into licensing advice.

Engines below that line are supported *through this contract* instead, so the licence choice stays with whoever installs the engine.

Above the line, and therefore shipped: Quill (BSD-3-Clause), HugeRTE (MIT) and Jodit (MIT). For Jodit that means the free
`jodit` package only — `jodit-pro` and the OEM builds are separate commercial products under their own terms, and no
first-party adapter targets them.

HugeRTE is the migration path off TinyMCE. It is the community fork of TinyMCE 6, taken when TinyMCE 7 moved to GPL, so
the configuration you already have largely carries over. Two caveats belong in the decision: it is maintained by
volunteers rather than a company, and it cannot absorb fixes made upstream in TinyMCE 7+ because those are GPL. The
mitigation is the same one that applies to every engine here — you sanitize on the server, so a bug in the editor is
not a hole in your application.

### TinyMCE 7+

TinyMCE is GPL-2.0-or-later or commercial. Self-hosted builds disable themselves unless you either buy a key or opt in explicitly:

```vue
<script setup lang="ts">
import Editor from '@tinymce/tinymce-vue';
import type { WysiwygAdapterProps } from '@form-builder/wysiwyg/types';

const props = withDefaults(defineProps<WysiwygAdapterProps>(), {
    modelValue: '',
    config: () => ({}),
});

const emit = defineEmits<{ 'update:modelValue': [string] }>();
</script>

<template>
    <Editor
        :model-value="props.modelValue"
        :init="{ license_key: 'gpl', ...props.config }"
        :disabled="props.disabled"
        @update:model-value="emit('update:modelValue', $event)"
    />
</template>
```

`license_key: 'gpl'` is an explicit acceptance of GPL-2.0-or-later for your application. If that is not what you want, buy a commercial key or use a permissive engine.

### CKEditor 5

CKEditor 5 is GPL-2.0-or-later or commercial, requires `config.licenseKey` since v44, and renders a "Powered by CKEditor" badge under the GPL licence:

```vue
<script setup lang="ts">
import { ClassicEditor, Essentials, Paragraph } from 'ckeditor5';
import { Ckeditor } from '@ckeditor/ckeditor5-vue';
import 'ckeditor5/ckeditor5.css';
import type { WysiwygAdapterProps } from '@form-builder/wysiwyg/types';

const props = withDefaults(defineProps<WysiwygAdapterProps>(), {
    modelValue: '',
    config: () => ({}),
});

const emit = defineEmits<{ 'update:modelValue': [string] }>();

const config = {
    licenseKey: 'GPL',
    plugins: [Essentials, Paragraph],
    ...props.config,
};
</script>

<template>
    <Ckeditor
        :editor="ClassicEditor"
        :config="config"
        :model-value="props.modelValue"
        :disabled="props.disabled"
        @update:model-value="emit('update:modelValue', $event)"
    />
</template>
```

Both snippets are unmaintained examples. They are here to show the shape of an adapter, not to be kept working against upstream releases.

## Sanitize on the server

Every engine emits HTML whose shape you do not control, and client-side cleaning is UX rather than security. Sanitize on the server, on the way in, for every adapter — including the bundled Quill one, which calls `dangerouslyPasteHTML` by design.
