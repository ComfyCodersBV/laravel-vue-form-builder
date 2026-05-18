# Creating a Form

## Form class

Extend `AbstractForm` and implement two methods: `fields()` returns the list of fields, and `configure()` sets form-level options.

```php
<?php

declare(strict_types=1);

namespace App\Forms;

use TranquilTools\FormBuilder\AbstractForm;
use TranquilTools\FormBuilder\Fields\Submit;
use TranquilTools\FormBuilder\Fields\Text;
use TranquilTools\FormBuilder\FormConfig;

class UserForm extends AbstractForm
{
    public function configure(FormConfig $form): void
    {
        $form->class('space-y-4');
    }

    public function fields(): array
    {
        return [
            Text::make('name')
                ->label('Name')
                ->required(),

            Text::make('email')
                ->label('Email')
                ->email()
                ->required(),

            Submit::make()->label('Save'),
        ];
    }
}
```

## `configure(FormConfig $form)`

Use this method to set form-level configuration. Commonly used options:

```php
public function configure(FormConfig $form): void
{
    $form
        ->id('user-form')
        ->class('space-y-6')
        ->action(route('users.store'))
        ->method('POST');
}
```

| Method | Description |
|---|---|
| `id(string)` | HTML `id` attribute on the form element |
| `class(string\|array)` | CSS classes on the form element |
| `action(string)` | Form submission URL |
| `method(string)` | HTTP method: `GET`, `POST`, `PUT`, `PATCH`, `DELETE` |

> **Note:** `action` and `method` are usually set in the controller so you can pass different values for create vs. edit without subclassing the form.

## Using the form in a controller

Call `FormClass::make()` to build the schema, then chain `action()`, `method()`, and `fill()` before passing it to Inertia.

```php
use App\Forms\UserForm;
use Inertia\Inertia;

// Create
public function create(): Response
{
    return Inertia::render('Users/Create', [
        'form' => UserForm::make()
            ->action(route('users.store'))
            ->method('POST'),
    ]);
}

// Edit
public function edit(User $user): Response
{
    return Inertia::render('Users/Edit', [
        'form' => UserForm::make()
            ->action(route('users.update', $user))
            ->method('PUT')
            ->fill($user),
    ]);
}
```

## `fill($data)`

Pre-populates field values from an Eloquent model or an array:

```php
->fill($user)           // Eloquent model
->fill($request->all()) // Array
->fill(['name' => 'John', 'email' => 'john@example.com'])
```

## Passing constructor arguments

If your form needs external data (like a list of options that depends on the current user), add a constructor:

```php
class ProductForm extends AbstractForm
{
    public function __construct(private readonly User $user) {}

    public function fields(): array
    {
        return [
            Select::make('warehouse_id')
                ->label('Warehouse')
                ->options(
                    $this->user->warehouses()->pluck('name', 'id')->toArray()
                ),
        ];
    }
}
```

Pass the arguments through `make()`:

```php
ProductForm::make($user)
    ->action(route('products.store'))
```

And through `rules()` for validation:

```php
class ProductFormRequest extends FormRequest
{
    public function rules(): array
    {
        return ProductForm::rules(auth()->user());
    }
}
```
