#  A VueJS/Inertia FormBuilder package for Laravel 

## Installation

You can install the package via composer:

```bash
composer require tranquil-tools/laravel-vue-form-builder
```

Install the Quill wysiwyg editor dependencies:
```cli
npm install vue-quilly quill quill-image-resize-module
npm run build
```

You can publish the config file with:

```bash
php artisan vendor:publish --tag="vue-form-builder-config"
```

The content of the published config can be viewed [here](./config/vue-form-builder.php).

Alter you vite.config.ts to add an `@form-builder` alias:
```ts
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    plugins: [
        // ...
    ],
    resolve: {
        alias: {

            // Add this:

            '@form-builder': path.resolve(__dirname, 'vendor/tranquil-tools/laravel-vue-form-builder/resources/js'),
        },
    },
});
```

## Basic usage

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Forms\CategoryForm;
use App\Http\Requests\CategoryFormRequest;
use App\Models\ExampleModel;
use Inertia\Inertia;
use Inertia\Response;

class ExampleController extends Controller
{
    public function edit(ExampleModel $model): Response
    {
        return Inertia::render('PathToVueFile', [
            'form' => ExampleForm::make()
                ->action(route('categories.update', $model))
                ->method('PUT')
                ->fill($model),
        ]);
    }
}
```

```php
<?php

declare(strict_types=1);

namespace App\Forms;

use App\Models\Template;
use TranquilTools\FormBuilder\AbstractForm;
use TranquilTools\FormBuilder\Fields\Number;
use TranquilTools\FormBuilder\Fields\Select;
use TranquilTools\FormBuilder\Fields\Submit;
use TranquilTools\FormBuilder\Fields\Text;
use TranquilTools\FormBuilder\Fields\Wysiwyg;
use TranquilTools\FormBuilder\FormConfig;

class ExampleForm extends AbstractForm
{
    public function configure(FormConfig $form)
    {
        $form->class(['space-y-4', 'mx-auto', 'mt-3']);
    }

    public function fields(): array
    {
        return [
            Number::make('position')
                ->label(__('Order'))
                ->rules([
                    'required',
                    'integer',
                    'min:1',
                ]),

            Text::make('title')
                ->label(__('Name'))
                ->autocomplete(false)
                ->rules([
                    'required',
                    'string',
                    'max:255',
                ]),

            Text::make('description')
                ->label(__('Description'))
                ->autocomplete(false)
                ->rules([
                    'required',
                    'string',
                    'max:255',
                ]),
                
            Wysiwyg::make('content')
                ->label(__('Content')),

            Select::make('template_id')
                ->label(__('Template'))
                ->options(Template::all()->pluck('name', 'id')->toArray())
                ->rules([
                    'nullable',
                    'exists:templates,id',
                ]),

            Submit::make()
                ->label(__('Save')),
        ];
    }
}
```

```php
<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Forms\ExampleForm;
use Illuminate\Foundation\Http\FormRequest;

class ExampleFormRequest extends FormRequest
{
    public function rules(): array
    {
        return ExampleForm::rules();
    }
}
```

```vue
<script setup lang="ts">
import Form from '@form-builder/components/Form.vue';
import { FormSchema } from '@form-builder/types/form-builder';

defineProps<{
    form: FormSchema;
}>();
</script>

<template>
    <div class="...">
        <div class="...">
            <Form :schema="form" />
        </div>
    </div>
</template>
```
