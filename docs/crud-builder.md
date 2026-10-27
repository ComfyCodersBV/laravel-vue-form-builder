# CrudBuilder

The **[CrudBuilder](https://docs.comfycoders.nl/laravel-vue-crud-builder)** (`tranquil-tools/laravel-vue-crud-builder`)
scaffolds complete create, read, update and delete screens on top of this package and the
[TableBuilder](https://docs.comfycoders.nl/laravel-vue-table-builder). This page describes what it does with forms.
Everything it generates is a plain form class, request and Vue page, so the rest of these docs apply unchanged.

## What it adds on top of FormBuilder

FormBuilder gives you the building blocks: a form class, the `Form` Vue component and the validation rules that come
with each field. You still write the controller actions, the FormRequest and the page that shows the form yourself.
The CrudBuilder writes those for you in one command:

```bash
php artisan make:crud Product --model=App\\Models\\Product
```

For the form side of a resource, it generates:

- **A form class with fields from your database schema.** `app/Forms/ProductForm.php` gets one field per column,
  using the first rule that matches:
    - a `Select` with options from the related model for integer `*_id` foreign keys
    - `Email` for any column whose name contains `email`, `Password` for names containing `password`, and `Color` for
      names containing `color` or `colour`
    - `Toggle` for boolean and `tinyint` columns and for names starting with `is_` or `has_`
    - `Textarea` for text columns, `Number` for integer and decimal columns, `Date` for `date` and `DateTime` for
      `datetime` and `timestamp` columns, and `Text` for string columns

  Non-nullable columns get `->required()`. A nullable foreign key gets `->nullable()` on its `Select`, other nullable
  columns get neither. Columns of any other type, such as `json` or `uuid`, are skipped and added by hand. The columns
  `id`, `password`, `remember_token`, `email_verified_at`, `created_at`, `updated_at` and `deleted_at` are never
  added to the form.
- **A FormRequest backed by the form.** `app/Http/Requests/ProductRequest.php` returns `ProductForm::rules()`, the
  same approach as [`make:form-request`](artisan-commands.md), so the rules stay in the form class.
- **Controller actions that build the form.** `create()` and `edit()` call `ProductForm::make()`, set the action and
  method, and fill the form from the model on edit. `store()` and `update()` save `$request->validated()`.
- **A create/edit page.** `Products/Form.vue` renders the `Form` component with the schema, and an optional delete
  button on the edit page.

## Example

A `products` table with a `name`, a `price`, an `is_active` flag and a `category_id` results in a form class like this:

```php
class ProductForm extends AbstractForm
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

            Number::make('price')
                ->label('Price')
                ->required(),

            Toggle::make('is_active')
                ->label('Is Active')
                ->required(),

            Select::make('category_id')
                ->label('Category')
                ->options(\App\Models\Category::query()->pluck('name', 'id')->toArray())
                ->required(),

            Submit::make(),
        ];
    }
}
```

The edit action in the generated controller uses it the same way you would by hand:

```php
public function edit(Product $product): Response
{
    $form = ProductForm::make()
        ->fill($product)
        ->action(route('products.update', $product))
        ->method('PATCH');

    return Inertia::render('Products/Form', [
        'form' => $form,
        'title' => 'Edit Product',
    ]);
}
```

From there you refine the generated form like any other: swap `Number` for a [`Money`](fields/money.md) field, add
[sections](fields/sections.md), or tighten the rules.

## When to use it

Use the CrudBuilder when a model needs the usual admin screens: a list, a detail page and a form to create and edit
records. It saves writing the same controller, request and page for every resource, and the generated code is yours
to change.

Stay with FormBuilder alone for forms that are not tied to one model's CRUD flow, such as a contact form, a settings
page, a wizard or a [filter form](filter-forms.md). `make:form` gives you an empty form class for those.

## Installation

```bash
composer require tranquil-tools/laravel-vue-crud-builder
php artisan crud-builder:install
```

The CrudBuilder requires this package and the TableBuilder, so Composer installs both. When this package is already in
your project, nothing changes for your existing forms.

Read the [CrudBuilder documentation](https://docs.comfycoders.nl/laravel-vue-crud-builder) for every option of
`make:crud`, the full schema mapping and the shared Vue pages, or browse the source on
[GitHub](https://github.com/ComfyCodersBV/laravel-vue-crud-builder).
