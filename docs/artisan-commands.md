# Artisan Commands

The generators ship with `tranquil-tools/laravel-form-builder`, the PHP core this package renders. They are available
as soon as this package is installed, because it requires the core as a Composer dependency.

| Command                    | Creates                                | Options                              |
|----------------------------|----------------------------------------|--------------------------------------|
| `make:form {name}`         | A form class in `app/Forms`            | `--request` / `-r`, `--force` / `-f` |
| `make:form-request {name}` | A `FormRequest` in `app/Http/Requests` | `--form=` / `-F`, `--force` / `-f`   |

## `make:form`

Generates a new form class extending `AbstractForm`:

```bash
php artisan make:form ProductForm
```

This creates `app/Forms/ProductForm.php` with a `configure()` method for the form settings and a `fields()` method
with a `Text` field and a `Submit` button as a starting point:

```php
class ProductForm extends AbstractForm
{
    public function configure(FormConfig $form)
    {
        $form
            ->action(route('...'))
            ->method('POST')
            ->class('space-y-4')
            ->fill([
                //
            ]);
    }

    public function fields(): array
    {
        return [
            Text::make('...')
                ->label(trans('...'))
                ->rules(['required', 'string', 'max:255'])
                ->attributes(['autocomplete' => 'off']),

            Submit::make()
                ->label(trans('Submit')),
        ];
    }
}
```

Replace the placeholders with your route, fields and labels. See [Creating a Form](creating-forms.md) for what goes in
each method.

A name with slashes creates a subfolder and namespace: `make:form Admin/ProductForm` writes
`app/Forms/Admin/ProductForm.php` in the `App\Forms\Admin` namespace.

### Creating the FormRequest in the same step

After writing the form, the command asks whether to create a matching FormRequest as well. The default answer is
**Yes**, so the request is also created when you run the command with `--no-interaction`. Pass `--request` (`-r`) to
create it without the question:

```bash
php artisan make:form ProductForm --request
```

This calls `make:form-request ProductFormRequest --form=App\Forms\ProductForm` for you.

### Options

| Option            | Description                                                   |
|-------------------|---------------------------------------------------------------|
| `--request`, `-r` | Create a FormRequest for the form without asking              |
| `--force`, `-f`   | Write the class even if a class with that name already exists |

Without `--force`, an existing form class is left untouched and the command stops before the FormRequest step.

## `make:form-request`

Generates a `FormRequest` that takes its validation rules and attribute names from a form class, so the rules live in
one place:

```bash
php artisan make:form-request ProductFormRequest
```

This creates `app/Http/Requests/ProductFormRequest.php`:

```php
<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Forms\ProductForm;
use Illuminate\Foundation\Http\FormRequest;

class ProductFormRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ProductForm::rules();
    }

    public function attributes(): array
    {
        return ProductForm::attributes();
    }
}
```

`authorize()` returns `true`. Replace it with a real check, such as a policy call, before you use the request on a
route that needs a permission.

### How the form class is found

Pass the form with `--form` (`-F`) to be explicit. A full class name is used as is. A short name is looked up in
`App\Forms` when your application has an `app/Forms` folder, and directly under `App\` when it does not:

```bash
php artisan make:form-request StoreProductRequest --form=ProductForm
php artisan make:form-request StoreProductRequest --form=App\\Domain\\Shop\\Forms\\ProductForm
```

Without `--form`, the command guesses from the request name. A name ending in `FormRequest` has that suffix stripped,
and the command then looks for `App\Forms\Product` and `App\Forms\ProductForm`, in that order. When neither class
exists, the request refers to `App\Forms\Form` and you change the reference by hand. The guess only works for names
ending in `FormRequest`, so use `--form` for any other name.

Like a short `--form` name, the guessed names and the `Form` fallback sit in `App\Forms` only when `app/Forms` exists.
Without that folder the command looks for `App\Product` and `App\ProductForm`, and falls back to `App\Form`. Run
`make:form` first, which creates the folder, to get the `App\Forms` namespace.

### Forms with constructor arguments

`rules()` and `attributes()` pass their arguments on to the form's constructor. When a form needs a model, for example
to ignore the current record in a `unique` rule, hand it over from the route:

```php
public function rules(): array
{
    return ProductForm::rules($this->route('product'));
}

public function attributes(): array
{
    return ProductForm::attributes($this->route('product'));
}
```

See [Validation](validation.md) for the other ways to validate against a form.

## Customising the stubs

Both commands first look for a stub in your application before they fall back to the package's own:

| Command             | Stub in your application  |
|---------------------|---------------------------|
| `make:form`         | `stubs/form.stub`         |
| `make:form-request` | `stubs/form-request.stub` |

Copy the stub from `vendor/tranquil-tools/laravel-form-builder/stubs/` into your project's `stubs/` folder and adjust
it, for example to add the fields every form in your project starts with. The request stub supports the
`{{ namespace }}`, `{{ class }}`, `{{ namespacedForm }}` and `{{ form }}` placeholders.

## Scaffolding a complete resource

To generate a form together with its table, controller, request and Vue pages in one go, use `make:crud` from the
[CrudBuilder](crud-builder.md).
