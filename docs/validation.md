# Validation

## Validation rules on fields

Add Laravel validation rules directly on each field. Rules are automatically extracted from the form schema.

```php
Text::make('email')
    ->rules('required', 'email', 'max:255')

Number::make('age')
    ->rules(['required', 'integer', 'min:18'])

Select::make('role')
    ->rules('required', 'in:admin,editor,viewer')
```

Rules can be passed as separate string arguments or as a single array — both work.

## Convenience rule methods

Some fields have shorthand methods that both configure the UI and add the matching validation rule:

| Field | Method | Adds rule |
|---|---|---|
| `Text` | `->required()` | `required` |
| `Text` | `->maxLength(255)` | `max:255` |
| `Text` | `->minLength(3)` | `min:3` |
| `Number` | `->maxValue(100)` | `max:100` |
| `Number` | `->minValue(0)` | `min:0` |
| `File` | `->accept('image/jpeg', 'image/png')` | `mimetypes:image/jpeg,image/png` |
| `KeyValue` | _(automatically)_ | `array` |
| `Money` | `->minValue(0.5)` / `->maxValue(1000)` | `MoneyBounds` (message in major units with currency) |
| `Date` | `->disabledWeekdays([0, 6])` / `->disabledDates([...])` | `AvailableDate` |
| `Date` | `->minDate(...)` / `->maxDate(...)` with `->validateBounds()` | `DateBounds` |

## Using rules in a Form Request

The recommended approach is to create a `FormRequest` that delegates to the form class:

```php
<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Forms\ProductForm;
use Illuminate\Foundation\Http\FormRequest;

class ProductFormRequest extends FormRequest
{
    public function rules(): array
    {
        return ProductForm::rules();
    }
}
```

Return the form's attribute names from `attributes()` too, so errors on a translatable field read "Title (English)"
instead of "title.en" (see [Translatable](fields/translatable.md#friendly-attribute-names)):

```php
public function attributes(): array
{
    return ProductForm::attributes();
}
```

If your form class accepts constructor arguments, pass them through `rules()` as well:

```php
public function rules(): array
{
    return ProductForm::rules(auth()->user());
}
```

Then use the request in your controller as normal:

```php
public function store(ProductFormRequest $request): RedirectResponse
{
    Product::query()->create($request->validated());

    return redirect()->route('products.index');
}
```

## Labels in validation messages

Laravel names a field by its key in a message: "The arrival on field is required." Name fields by their label instead
("The Arrival field is required.") per form:

```php
public function configure(FormConfig $form): void
{
    $form->labelsAsAttributes();
}
```

Or for every form with `'validation' => ['label_attributes' => true]` in `config/form-builder.php`;
`->labelsAsAttributes(false)` opts a form out again. It is off by default, so existing messages stay as they are.

The labels end up in the same attribute names as those of [translatable fields](fields/translatable.md#friendly-attribute-names):
`$form->getAttributes()`, `ProductForm::attributes()` for a FormRequest, and `validate()`, which passes them on by
itself. A field's own names (such as "Title (English)") win over its label, and attributes you pass to `validate()` win
over both. A field without a label keeps its key, and a separate radio (`Radio::make('plan')->value('pro')->label('Pro')`)
is skipped, because its label names the option rather than the field.

Requires `tranquil-tools/laravel-form-builder` 1.6 or newer.

## Errors outside the fields

Errors on keys that match no field are shown at the top of the form. See
[Vue Usage](vue-usage.md#errors-that-belong-to-no-field).

## Inline validation

For cases where you don't want a dedicated `FormRequest`, call `validate()` directly on the form config:

```php
public function store(Request $request): RedirectResponse
{
    $validated = ProductForm::make()->validate($request);

    Product::query()->create($validated);

    return redirect()->route('products.index');
}
```

Or get just the rules array:

```php
$rules = ProductForm::make()->getRules();
$validated = $request->validate($rules);
```

## reCAPTCHA validation

When using the `Recaptcha` field, a custom `recaptcha` validation rule is registered automatically. Include the field in your form and ensure your `FormRequest` uses `Form::rules()` — the reCAPTCHA rule is included automatically.

You can also reference it manually:

```php
'g-recaptcha-response' => 'recaptcha:submit,0.5',
// recaptcha:{action},{min_score}
```

See [Other Fields](fields/other) for reCAPTCHA field configuration.
