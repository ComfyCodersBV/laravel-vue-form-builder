# Configuration

Publish the config file to customize WYSIWYG and reCAPTCHA settings:

```bash
php artisan vendor:publish --tag="vue-form-builder-config"
```

This creates `config/vue-form-builder.php`.

---

## WYSIWYG

### Default editor

```php
'wysiwyg' => [
    'default-editor' => 'quill', // 'quill' or 'textarea'
],
```

The default editor applies to any `Wysiwyg` field that does not call `->editor()` explicitly.

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
                'imageResize' => [
                    'modules' => ['Resize', 'DisplaySize', 'Toolbar'],
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
