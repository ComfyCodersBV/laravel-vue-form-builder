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
- `columns` (optional) — `1` (default) or `2`, see below

## Two columns

Pass `columns="2"` to lay the fields out in a responsive two-column grid. Below the `md` breakpoint the form stays a single column.

```vue
<template>
    <Form :schema="form" :columns="2" />
</template>
```

Fields that need the full width get it automatically: `wysiwyg`, `textarea`, `repeater`, `keyvalue`, `hidden` and the button types. Any other field can ask for the same with `fullWidth` in its schema:

```vue
<template>
    <Form
        :schema="form"
        :columns="2"
        :field-overrides="{ notes: { fullWidth: true } }"
    />
</template>
```

With the default `columns="1"` the renderer still emits no wrapper element at all, so existing markup and CSS are untouched.

## Horizontal labels

`layout="horizontal"` puts the label to the left of its control instead of above it, from the `sm` breakpoint up. Fields without a label stay stacked.

```vue
<template>
    <Form :schema="form" layout="horizontal" />
</template>
```

## Submitting without Inertia

By default the form submits through Inertia's `useForm()`. Pass `transport="http"` to submit over `fetch` instead and stay on the page — useful in a modal, a side panel or an admin screen that keeps its own state.

```vue
<template>
    <Form :schema="form" transport="http" @success="close" />
</template>
```

The built-in submitter:
- sends the `XSRF-TOKEN` cookie as an `X-XSRF-TOKEN` header, falling back to a `<meta name="csrf-token">` tag, so Laravel's `VerifyCsrfToken` does not answer `419`
- sends `X-Requested-With: XMLHttpRequest` and `Accept: application/json`, so validation failures come back as `422` JSON instead of a redirect
- switches to `multipart/form-data` as soon as a field holds a file, and spoofs `_method` for `PUT`, `PATCH` and `DELETE`
- spreads nested arrays and objects into `filters[status][0]=open` style parameters on a `GET`

Validation errors land on the matching field. Any other failure lands under the key `form`, which no field renders — read it yourself if you want to show it:

```vue
<template>
    <p v-if="formRef?.form.errors.form">{{ formRef.form.errors.form }}</p>
    <Form ref="formRef" :schema="form" transport="http" />
</template>
```

### Your own transport

Pass a `submitter` to route the request through your own client, and an `errorAdapter` when your API does not answer in Laravel's `{ errors: { field: [...] } }` shape.

```vue
<script setup lang="ts">
import type { HttpFormRequest } from '@form-builder';

async function submitter({ method, url, data }: HttpFormRequest) {
    return api.request({ method, url, data });
}

function errorAdapter(error: any) {
    return { name: error.response.data.detail };
}
</script>

<template>
    <Form
        :schema="form"
        transport="http"
        :submitter="submitter"
        :error-adapter="errorAdapter"
    />
</template>
```

> The form exposes its own API under the names `data`, `errors`, `processing`, `recentlySuccessful`, `reset`, `clearErrors`, `submit`, `get`, `post`, `put`, `patch` and `delete`. A field with one of those names throws on setup rather than silently overwriting the method.
