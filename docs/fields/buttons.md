# Buttons & Actions

## Submit

Renders a submit button. Add it as the last field in your `fields()` array.

```php
use TranquilTools\FormBuilder\Fields\Submit;

Submit::make()
    ->label('Save')
```

The `name` argument to `make()` is optional for submit buttons. The default label is `Save` (translatable via
`vue-form-builder::buttons.save`).

### Icon or markup on a button

Pass an `HtmlString` as label to put an icon or other markup on any button. Give icon-only buttons an `ariaLabel()` so
screen readers can name them:

```php
use Illuminate\Support\HtmlString;

Submit::make()
    ->label(new HtmlString('<svg ...></svg>'))
    ->ariaLabel('Add')
```

The markup is rendered as-is, so only pass HTML you control. A plain string label is always shown as text. The schema
keeps the text of the HTML in `label` (or the default label when there is none), which is also what the confirm
dialog shows.

### Disabled while submitting

The submit button is disabled while the form is on its way to the server (`form.processing`), with the Inertia
transport and with `transport="http"` alike, so a second click does not submit the form twice. A `DeleteButton` and a
`Button` with `->deleteUrl()` follow the same rule, and also stay disabled, with the confirm button in their dialog,
while their own `DELETE` request is on its way. Other buttons stay enabled.

### Confirm before submit

```php
Submit::make()
    ->confirmTitle('Save changes?')
    ->confirmMessage('This will update the record with the current values.')
```

### A label and disabled state that follow the form

`->labelExpression()` computes the label and `->disabledIf()` disables the button, both from an expression in the
language of [`->if()`](common-options.md#on-an-expression):

```php
Submit::make()
    ->label('Rebook')
    ->labelExpression("`\${action === 'return' ? 'Return to stock' : 'Rebook'} (\${ids.length})`")
    ->disabledIf('ids.length === 0')
```

- They update while the form changes, also on the submit button of the last [step](../steps.md).
- `$processing` is `true` while the form is submitting, for a label such as `$processing ? 'Saving…' : 'Save'` or a
  button that waits for the form: `->disabledIf('$processing || !ids.length')`.
- An expression that throws, or a label expression that gives an empty value, falls back to `->label()`. A
  `->disabledIf()` that throws disables the button, as a failing condition hides its field. During development the
  console shows a warning with the error.
- `->disabled()` keeps the button disabled whatever `->disabledIf()` says, and so does a submit that is
  [on its way](#disabled-while-submitting).
- A label given as an `HtmlString` is shown as it is: `->labelExpression()` does not replace markup.
- Both work on a `Button` and a `DeleteButton` as well.

---

## Button

A generic button. Use for custom in-form actions that do not submit the form.

```php
use TranquilTools\FormBuilder\Fields\Button;

Button::make('reset')
    ->label('Reset form')
```

### Handling a click

A click handler is Vue code, so it goes on the button through `fieldOverrides` rather than through `attributes()` in
PHP, which refuses `@click`:

```vue
<Form :schema="form" :field-overrides="{ reset: { onClick: () => resetFilters() } }" />
```

See [Click and other event handlers](../vue-usage.md#click-and-other-event-handlers).

### Emitting an event

`->emit('make-rows')` makes the button fire [`@button`](../vue-usage.md#button) on `<Form>` with that name, so the
form class shows what the button does and the page only handles the event:

```php
Button::make('make_rows')
    ->label('Make rows')
    ->emit('make-rows')
```

```vue
<Form :schema="form" @button="(event, { form }) => event === 'make-rows' && makeRows(form)" />
```

A button that asks for confirmation emits after the confirmation. An `onClick` from `fieldOverrides` keeps working
next to it. `Submit::emit()` and `DeleteButton::emit()` throw an `InvalidArgumentException`, and so does serializing a
`Button` with both `->emit()` and `->deleteUrl()`: those buttons submit or delete themselves and never emit.

### Variants

Control the button style using `variant()`:

```php
Button::make('archive')
    ->label('Archive')
    ->variant('secondary')
```

Available variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`.

### Confirm dialog

Any button can show a confirmation dialog before executing its action:

```php
Button::make('archive')
    ->label('Archive project')
    ->confirmTitle('Archive this project?')
    ->confirmMessage('The project will be moved to the archive.')
    ->cancelLabel('Keep active')
```

### Delete action

Combine the confirm dialog with a delete URL to send a `DELETE` request via Inertia:

```php
Button::make()
    ->label('Remove item')
    ->variant('destructive')
    ->deleteUrl(route('items.destroy', $item))
    ->confirmTitle('Remove this item?')
    ->confirmMessage('This action cannot be undone.')
```

---

## DeleteButton

A delete button with built-in confirmation dialog. On confirmation, it sends a `DELETE` request to the given URL via
Inertia.

```php
use TranquilTools\FormBuilder\Fields\DeleteButton;

DeleteButton::make()
    ->label('Delete product')
    ->deleteUrl(route('products.destroy', $product))
```

### Customizing the confirmation dialog

```php
DeleteButton::make()
    ->label('Delete account')
    ->deleteUrl(route('account.destroy'))
    ->confirmTitle('Are you sure?')
    ->confirmMessage('This will permanently delete your account and all associated data.')
    ->cancelLabel('Keep my account')
```

---

## Shared methods

All button types (`Button`, `Submit`, `DeleteButton`) support these methods:

| Method                      | Description                                                                              |
|-----------------------------|------------------------------------------------------------------------------------------|
| `->label(string)`           | Button label text                                                                        |
| `->label(HtmlString)`       | Button label as markup, e.g. an icon (rendered as-is)                                    |
| `->ariaLabel(string)`       | Accessible name, for icon-only buttons                                                   |
| `->variant(string)`         | Button style variant (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`) |
| `->confirmTitle(string)`    | Title shown in the confirmation dialog                                                   |
| `->confirmMessage(string)`  | Body text of the confirmation dialog                                                     |
| `->cancelLabel(string)`     | Label of the cancel button in the dialog                                                 |
| `->deleteUrl(string)`       | URL for a `DELETE` request (sent via Inertia on confirm)                                 |
| `->labelExpression(string)` | Label computed from the form                                                             |
| `->disabledIf(string)`      | Disables the button while the expression holds                                           |
| `->emit(string)`            | Fires `@button` on `<Form>` with this name on click (`Button` only)                      |

## Translations

Default button labels are translatable. Publish the language files or add entries to your
`lang/vendor/vue-form-builder/` directory:

| Key                                         | Default (en)                                                            |
|---------------------------------------------|-------------------------------------------------------------------------|
| `vue-form-builder::buttons.save`            | Save                                                                    |
| `vue-form-builder::buttons.delete`          | Delete                                                                  |
| `vue-form-builder::buttons.cancel`          | Cancel                                                                  |
| `vue-form-builder::buttons.confirm-title`   | Are you sure?                                                           |
| `vue-form-builder::buttons.confirm-message` | This action cannot be undone. This will permanently delete this record. |
