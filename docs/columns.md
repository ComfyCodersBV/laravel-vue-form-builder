# Columns

Fields stack below each other by default. Two places lay them out in columns instead, and both collapse to a single
column below the `md` breakpoint.

## On the whole form

The `columns` prop of `<Form>` (and `FormRenderer`) takes `1` (default) to `4`:

```vue
<template>
    <Form :schema="form" :columns="3" />
</template>
```

## On a section

`Section::make()->columns(n)` lays out the fields of that section only, whatever the form does:

```php
Section::make()
    ->title('Address')
    ->columns(3)
    ->fields([
        Text::make('street')->columnSpan(2),
        Text::make('number'),
        Text::make('postcode'),
        Text::make('city')->columnSpan(2),
    ]),
```

A nested section without `->columns()` uses the columns of the section around it, or those of the form; `->columns(1)`
stacks its fields again. See [Sections](fields/sections.md#columns).

## Spanning columns

| Method | Effect |
|---|---|
| `->columnSpan(n)` | the field takes `n` columns; more than there are means the whole row |
| `->columnSpanFull()` | the field takes the whole row |

Textareas, WYSIWYG editors, repeaters, key-value fields, buttons, hidden fields and sections take the whole row unless
they set a `->columnSpan()`. From the Vue side, `fullWidth` and `columnSpan` in `field-overrides` do the same:

```vue
<Form :schema="form" :columns="2" :field-overrides="{ notes: { fullWidth: true } }" />
```

The grid uses `md:grid-cols-2` to `md:grid-cols-4` and `md:col-span-2` to `md:col-span-4`. They live in the package's
Vue components, so the `@source` line from [Installation](installation.md) picks them up.

Requires `tranquil-tools/laravel-form-builder` 1.5 and `laravel-vue-form-builder` 1.8 or newer for sections and
spans; form-level columns 3 and 4 only need the renderer.
