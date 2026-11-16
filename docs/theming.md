# Theming

Every field renders the same chrome around its own control: a wrapper, a label, help text and an
error message, plus the asterisk of a required field. Those are themeable from PHP. When classes are not enough, a slot
replaces only the control of a field, or the field outright.

## The elements

| Key | Element | Default |
|---|---|---|
| `wrapper` | the `div` around the whole field | `space-y-1` |
| `label` | the `<label>` | `block text-sm font-medium text-neutral-800 dark:text-neutral-200` |
| `help` | the help text under the control | `mt-1 text-xs text-neutral-500 dark:text-neutral-400` |
| `error` | the validation message | `text-sm text-red-600` |
| `required` | the asterisk after the label of a required field | `ml-0.5 text-red-600` |

## Application-wide

Publish the config and set the keys you want to change:

```php
// config/form-builder.php
'theme' => [
    'label' => 'text-sm uppercase tracking-wide text-slate-600',
    'error' => 'text-sm text-rose-700',
],
```

A key left `null` or empty keeps the renderer's default rather than blanking it. The theme travels
in the schema, so it is the PHP core that owns it — any renderer built on this contract inherits the
same classes.

## Per field

```php
Text::make('title')->theme(['label' => 'sr-only']);
```

Repeated calls merge, and keys you leave out fall back to the application-wide theme.

## How the layers combine

Defaults, then the config theme, then the field theme — each merged over the previous one through
`tailwind-merge`. A conflicting utility wins over the one it conflicts with instead of both landing
in the class list:

```php
'theme' => ['error' => 'text-rose-700']
// renders class="text-sm text-rose-700" — the size survives, the colour is replaced
```

This makes the theme a tool for adjusting the defaults. To discard them entirely, use a slot.

> `->wrapperClass('...')`, and `->class('...')` which it replaces in name only, still replace the
> wrapper outright rather than merging into it, which is what `->class()` has always done. Use
> `->theme(['wrapper' => '...'])` to add to the wrapper instead. Classes for the control itself go
> through `->inputClass('...')`, see [Common options](fields/common-options.md#css-classes).

## Replacing a field entirely

`<Form>` accepts a slot per field name, and per field type as a broad stroke. A slot named after a
field wins over one named after its type.

```vue
<Form :schema="form">
    <template #title="{ field, modelValue, error, 'onUpdate:modelValue': update }">
        <MyOwnInput :label="field.label" :model-value="modelValue" @update:model-value="update" />
        <span v-if="error">{{ error }}</span>
    </template>

    <template #wysiwyg="{ field }">
        <MyEditor :name="field.name" />
    </template>
</Form>
```

Slot props are `field`, `form`, `error`, `modelValue` and `onUpdate:modelValue`. Writing through
`onUpdate:modelValue` keeps the Inertia form object in sync and fires the form's `onFieldChange`,
exactly as a built-in field does.

Slots reach fields nested inside a `Repeater` as well, so a `#title` slot applies to a `title`
sub-field in every row.

## Replacing only the input

An `#input-{name}` slot replaces the control of one field and keeps everything around it: the label with its `for`, the
required asterisk, the help text, the error message, the theme and the column span. Bind `id` to your control so the
label points at it, and `describedby` so a screen reader reads the help text and the error with it:

```vue
<Form :schema="form">
    <template #input-size="{ id, name, modelValue, update, describedby, invalid, required, disabled, field }">
        <select
            :id="id"
            :name="name"
            :value="modelValue ?? ''"
            :disabled="disabled"
            :aria-describedby="describedby"
            :aria-invalid="invalid || undefined"
            :aria-required="required || undefined"
            class="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            @change="update(($event.target as HTMLSelectElement).value)"
        >
            <option value="" disabled>{{ field.placeholder }}</option>
            <option value="small">Small</option>
            <option value="large">Large</option>
        </select>
    </template>
</Form>
```

A component of your own takes the same props, so `v-bind` hands it everything at once:

```vue
<template #input-caliber="input">
    <CaliberSelect v-bind="input" :calibers="calibers" />
</template>
```

| Prop | Holds |
|---|---|
| `id` | the id the label points at, with the form id and, in a repeater, the row: `order-lines-0-size` |
| `name` | the field name |
| `modelValue` | the current value |
| `update` / `onUpdate:modelValue` | writes a new value to the form and fires its `onFieldChange`, like a built-in field |
| `describedby` | the ids of the help text and the error that are shown, for `aria-describedby`, or `undefined` |
| `invalid` | `true` while the field has an error, for `aria-invalid` |
| `required` | `true` when the label shows the required asterisk, for `aria-required` |
| `disabled`, `readonly` | the field's `->disabled()` and `->readonly()` as booleans |
| `error` | the error message of the field, a string or a list |
| `field` | the field schema, with its `field-overrides` applied |
| `form` | the form object; inside a repeater the row |

The help text renders with the id `{id}-help` and the error with `{id}-error`, on built-in fields as well.

Type the props with `InputSlotProps` from `@form-builder/types/form-builder`.

An input slot works wherever the field is: inside a section, in a wizard step and in every repeater row, where `id`,
`modelValue`, `error` and `update` belong to that row; in a [repeater table](fields/repeater.md#table) `describedby` also
points at the column's help text. It applies to fields with a value, not to a section, step, `Repeater`, `Hidden`,
`Display`, reCAPTCHA or a button.

An `#input-{type}` slot, such as `#input-text`, does the same for every field of that type, also in repeater rows, with
the same exceptions. The order is: a slot for the whole field (`#size`), then `#input-size`, then `#input-text`, then a
slot for the whole type (`#text`).
