# Other Fields

## Hidden

A hidden input field. Useful for passing IDs, tokens, or other data that should be included in the form submission without being visible.

```php
use TranquilTools\FormBuilder\Fields\Hidden;

Hidden::make('user_id')
    ->default(auth()->id())
```

Hidden fields do not render any visible UI. Their value is submitted with the form.

---

## Recaptcha

Integrates [Google reCAPTCHA v3](https://developers.google.com/recaptcha/docs/v3) into the form. The field renders invisibly, obtains a token from Google's API, and includes it in the form submission. A custom `recaptcha` validation rule verifies the token server-side.

```php
use TranquilTools\FormBuilder\Fields\Recaptcha;

Recaptcha::make()
```

By default, `Recaptcha::make()` reads its site key, action, and minimum score from the config. No additional configuration is required if `RECAPTCHA_SITE_KEY` and `RECAPTCHA_SECRET_KEY` are set in your `.env`.

### Overriding config values per field

```php
Recaptcha::make()
    ->action('contact_form')
    ->minScore(0.7)
    ->siteKey('your-site-key')
```

**Methods:**

| Method | Description |
|---|---|
| `->action(string)` | reCAPTCHA action name (used in score analysis) |
| `->minScore(float)` | Minimum score to pass (0.0–1.0, default: `0.5`) |
| `->siteKey(string)` | Override the site key from config |

### Validation

The validation rule is automatically included when you use `Form::rules()` or `FormConfig::getRules()`. The rule format is:

```
recaptcha:{action},{min_score}
```

Example: `recaptcha:contact_form,0.7`

### Disabling in tests

Set `RECAPTCHA_ENABLED=false` in your `.env.testing` to skip reCAPTCHA verification during tests. See [Configuration → reCAPTCHA](../configuration#recaptcha).
