# Laravel Vue Form Builder

A Laravel package that lets you define forms in PHP and render them in Vue, without writing any HTML/VueJS yourself.

Define fields and validation rules in a PHP class. The package serializes this into a JSON schema, passes it via Inertia, and a Vue component renders the complete form with labels, error messages, and submission handling.

## How it works

1. Define a form class in PHP extending `AbstractForm`
2. Pass the schema to your Vue page via Inertia
3. Render it with a single `<Form :schema="form" />` component

## Quick example

**PHP form class:**

```php
<?php

declare(strict_types=1);

namespace App\Forms;

use TranquilTools\FormBuilder\AbstractForm;
use TranquilTools\FormBuilder\Fields\Select;
use TranquilTools\FormBuilder\Fields\Submit;
use TranquilTools\FormBuilder\Fields\Text;
use TranquilTools\FormBuilder\FormConfig;

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
                ->required()
                ->rules('string', 'max:255'),

            Select::make('category_id')
                ->label('Category')
                ->options(Category::query()->pluck('name', 'id')->toArray())
                ->rules('nullable', 'exists:categories,id'),

            Submit::make()->label('Save'),
        ];
    }
}
```

**Controller:**

```php
return Inertia::render('Products/Edit', [
    'form' => ProductForm::make()
        ->fill($product)
        ->action(route('products.update', $product))
        ->method('PUT'),
]);
```

**Vue page:**

```vue
<script setup lang="ts">
import Form from '@form-builder/components/Form.vue';
import type { FormSchema } from '@form-builder/types/form-builder';

defineProps<{ form: FormSchema }>();
</script>

<template>
    <Form :schema="form" />
</template>
```

## Next steps

- [Installation](installation.md) — set up the package
- [Creating a Form](creating-forms.md) — define your first form class
- [Field Types](fields/common-options.md) — browse all available fields
