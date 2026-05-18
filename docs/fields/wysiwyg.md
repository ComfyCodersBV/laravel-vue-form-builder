# WYSIWYG Field

A rich text editor field. Uses [Quill](https://quilljs.com) by default, with a plain-textarea fallback.

```php
use TranquilTools\FormBuilder\Fields\Wysiwyg;

Wysiwyg::make('content')
    ->label('Content')
    ->rules('nullable', 'string')
```

> **Dependency:** The Quill editor requires `vue-quilly`, `quill`, and `quill-image-resize-module`. See [Installation](../installation).

---

## Choosing an editor

### Use Quill (default)

```php
Wysiwyg::make('content')
    ->editor('quill')
```

### Use the textarea fallback

Useful when you only need plain text or want to avoid the Quill dependency:

```php
Wysiwyg::make('content')
    ->editor('textarea')
```

The default editor is controlled by `config('vue-form-builder.wysiwyg.default-editor')`. See [Configuration](../configuration).

---

## Customizing Quill options

Override the Quill configuration for a specific field:

```php
Wysiwyg::make('summary')
    ->label('Summary')
    ->options([
        'theme' => 'snow',
        'modules' => [
            'toolbar' => [
                ['bold', 'italic', 'underline'],
                [['list' => 'ordered'], ['list' => 'bullet']],
                ['clean'],
            ],
        ],
    ])
```

Options passed to `->options()` replace the defaults from the config file for this field instance.

To set global defaults for all `Wysiwyg` fields, publish and edit the config file:

```bash
php artisan vendor:publish --tag="vue-form-builder-config"
```

See [Configuration → WYSIWYG](../configuration#wysiwyg) for the full options reference.
