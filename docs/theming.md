# Theming

Every field renders the same chrome around its own control: a wrapper, a label, help text and an
error message. Those four are themeable from PHP, and any field can be replaced outright with a
slot when classes are not enough.

## The four elements

| Key | Element | Default |
|---|---|---|
| `wrapper` | the `div` around the whole field | `space-y-1` |
| `label` | the `<label>` | `block text-sm font-medium text-neutral-800 dark:text-neutral-200` |
| `help` | the help text under the control | `mt-1 text-xs text-neutral-500 dark:text-neutral-400` |
| `error` | the validation message | `text-sm text-red-600` |

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

> `->class('...')` still replaces the wrapper outright rather than merging into it, which is what it
> has always done. Use `->theme(['wrapper' => '...'])` to add to the wrapper instead.

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
