# Configuration

Publish the config file to customize WYSIWYG and reCAPTCHA settings:

```bash
php artisan vendor:publish --tag="form-builder-config"
```

This creates `config/form-builder.php`. The file belongs to the PHP core,
`tranquil-tools/laravel-form-builder`, which this package depends on.

> An existing `config/vue-form-builder.php` from before the core was split out keeps working: its
> values are merged over `form-builder.php` and win. Rename the file when convenient — the old name
> logs a deprecation warning while `APP_DEBUG` is on.

---

## Theme

The `theme` block sets the classes for the wrapper, label, help text and error message every field
renders around its control. See [Theming](theming.md).

---

## WYSIWYG

### Default editor

```php
'wysiwyg' => [
    'default-editor' => 'quill', // any registered key, or 'textarea'
],
```

The default editor applies to any `Wysiwyg` field that does not call `->editor()` explicitly.

The key must be [registered in your app entrypoint](fields/wysiwyg#registering-an-editor), otherwise the field renders a textarea. Only `textarea` works without registration.

### Quill options

Customize the Quill toolbar and modules under `editors.quill.options`:

```php
'editors' => [
    'quill' => [
        'options' => [
            'theme' => 'snow',
            'showSourceButton' => true,
            'modules' => [
                'toolbar' => [
                    ['bold', 'italic', 'underline'],
                    [['list' => 'ordered'], ['list' => 'bullet']],
                    ['link', 'image'],
                    ['clean'],
                ],
            ],
        ],
    ],
],
```

Any options set here are loaded as defaults when a `Wysiwyg` field is instantiated. You can override them per-field with `->options([...])`.

### Textarea fallback editor

Add a `textarea` entry under `editors` to configure the plain-textarea fallback:

```php
'editors' => [
    'textarea' => [
        'options' => [],
    ],
],
```

---

## reCAPTCHA

```php
'recaptcha' => [
    'site_key' => env('RECAPTCHA_SITE_KEY', ''),
    'secret_key' => env('RECAPTCHA_SECRET_KEY', ''),
    'default_action' => 'submit',
    'default_score' => 0.5,
    'enabled' => env('RECAPTCHA_ENABLED', true),
],
```

| Key | Description |
|---|---|
| `site_key` | Public key shown in the Vue component (loads from `RECAPTCHA_SITE_KEY`) |
| `secret_key` | Secret key used for server-side verification (loads from `RECAPTCHA_SECRET_KEY`) |
| `default_action` | Action name sent with each reCAPTCHA token |
| `default_score` | Minimum score (0.0–1.0) to pass validation. `1.0` = definitely human, `0.0` = likely bot |
| `enabled` | Set to `false` to skip reCAPTCHA verification entirely (useful in local/test environments) |

Add the keys to your `.env`:

```
RECAPTCHA_SITE_KEY=your-site-key
RECAPTCHA_SECRET_KEY=your-secret-key
RECAPTCHA_ENABLED=true
```

See [Other Fields → Recaptcha](fields/other#recaptcha) for field-level usage.
