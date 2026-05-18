# Artisan Commands

## `make:form`

Generates a new form class extending `AbstractForm`:

```bash
php artisan make:form ProductForm
```

Creates `app/Forms/ProductForm.php` with the `fields()` and `configure()` stubs ready to fill in.

## `make:form-request`

Generates a `FormRequest` that delegates validation to a form class:

```bash
php artisan make:form-request ProductFormRequest
```

Creates `app\Http\Requests\ProductFormRequest.php`. Open it and set the form class reference:

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

If your form class requires constructor arguments, pass them through `rules()`:

```php
public function rules(): array
{
    return ProductForm::rules($this->route('product'));
}
```
