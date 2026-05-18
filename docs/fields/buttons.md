# Buttons & Actions

## Submit

Renders a submit button. Add it as the last field in your `fields()` array.

```php
use TranquilTools\FormBuilder\Fields\Submit;

Submit::make()
    ->label('Save')
```

The `name` argument to `make()` is optional for submit buttons.

---

## Button

A generic button. Use for custom in-form actions that do not submit the form.

```php
use TranquilTools\FormBuilder\Fields\Button;

Button::make('reset')
    ->label('Reset form')
```

---

## DeleteButton

A delete button that opens a confirmation dialog before proceeding. On confirmation, it sends a `DELETE` request to the given URL via Inertia.

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

**Methods:**

| Method | Description |
|---|---|
| `->deleteUrl(string)` | URL for the `DELETE` request |
| `->confirmTitle(string)` | Title shown in the confirmation dialog |
| `->confirmMessage(string)` | Body text of the confirmation dialog |
| `->cancelLabel(string)` | Label of the cancel button in the dialog |
