# Vue Usage

## Basic usage

Import `Form.vue` from the `@form-builder` alias and pass the schema as a prop:

```vue
<script setup lang="ts">
import Form from '@form-builder/components/Form.vue';
import type { FormSchema } from '@form-builder/types/form-builder';

defineProps<{ form: FormSchema }>();
</script>

<template>
    <Form :schema="form" />
</template>
```

The component uses Inertia's `useForm()` internally and handles submission, error display, and loading state automatically.

## Events

### `@success`

Fired after a successful form submission (2xx response from Inertia):

```vue
<template>
    <Form :schema="form" @success="handleSuccess" />
</template>

<script setup lang="ts">
function handleSuccess() {
    // redirect, show toast, etc.
}
</script>
```

### `@error`

Fired when submission returns validation errors:

```vue
<template>
    <Form :schema="form" @error="handleError" />
</template>

<script setup lang="ts">
function handleError(errors: Record<string, string>) {
    console.log(errors);
}
</script>
```

## Reacting to field changes

Use `@onFieldChange` to run logic whenever any field value changes. This is useful for cross-field reactivity — for example, showing extra fields when a toggle is enabled, or fetching related data.

```vue
<template>
    <Form
        :schema="form"
        @onFieldChange="handleFieldChange"
    />
</template>

<script setup lang="ts">
function handleFieldChange(
    field: string,
    value: unknown,
    form: Record<string, unknown>
) {
    if (field === 'country' && value === 'US') {
        // do something
    }
}
</script>
```

The callback receives:
- `field` — the name of the field that changed
- `value` — the new value
- `form` — the entire current form state as a plain object

## Custom layouts with `FormRenderer`

`Form.vue` wraps everything in a `<form>` element. If you need a custom layout — for example, a two-column grid — use `FormRenderer.vue` instead. It renders as a fragment (no wrapper element) so it can be placed inside any grid or flex container.

```vue
<script setup lang="ts">
import FormRenderer from '@form-builder/components/FormRenderer.vue';
import type { FormSchema } from '@form-builder/types/form-builder';

defineProps<{ form: FormSchema }>();
</script>

<template>
    <form @submit.prevent="submit">
        <div class="grid grid-cols-2 gap-4">
            <FormRenderer :fields="form.fields" />
        </div>
        <button type="submit">Save</button>
    </form>
</template>
```

`FormRenderer` accepts:
- `fields` — the array of field schemas from the form config
- `form` (optional) — the current form state object (for conditional field visibility)
- `onFieldChange` (optional) — same callback as on `Form.vue`
