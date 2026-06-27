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

### Confirm before submit

```php
Submit::make()
    ->confirmTitle('Save changes?')
    ->confirmMessage('This will update the record with the current values.')
```

---

## Button

A generic button. Use for custom in-form actions that do not submit the form.

```php
use TranquilTools\FormBuilder\Fields\Button;

Button::make('reset')
    ->label('Reset form')
```

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

| Method                     | Description                                                                              |
|----------------------------|------------------------------------------------------------------------------------------|
| `->label(string)`          | Button label text                                                                        |
| `->variant(string)`        | Button style variant (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`) |
| `->confirmTitle(string)`   | Title shown in the confirmation dialog                                                   |
| `->confirmMessage(string)` | Body text of the confirmation dialog                                                     |
| `->cancelLabel(string)`    | Label of the cancel button in the dialog                                                 |
| `->deleteUrl(string)`      | URL for a `DELETE` request (sent via Inertia on confirm)                                 |

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
