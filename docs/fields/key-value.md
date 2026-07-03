# Key-Value Field

The `KeyValue` field lets users manage a dynamic list of key-value pairs. Rows can be added, removed, and reordered. The field submits its data as an array.

```php
use TranquilTools\FormBuilder\Fields\KeyValue;

KeyValue::make('metadata')
    ->label('Metadata')
    ->rules('array')
```

---

## Labels and placeholders

```php
KeyValue::make('settings')
    ->label('Settings')
    ->keyLabel('Setting name')
    ->valueLabel('Value')
    ->keyPlaceholder('e.g. timeout')
    ->valuePlaceholder('e.g. 30')
```

---

## Row controls

By default, all rows are editable, addable, deletable, and reorderable. Each behavior can be toggled:

```php
KeyValue::make('metadata')
    ->addable(false)      // Prevent adding new rows
    ->deletable(false)    // Prevent deleting rows
    ->reorderable(false)  // Disable drag-to-reorder
    ->editableKeys(false) // Keys are read-only (only values are editable)
    ->editableValues(false) // Values are read-only (only keys are editable)
```

### Customize the "Add" button label

```php
KeyValue::make('headers')
    ->addActionLabel('Add header')
```

---

## Readonly value keys

Lock the value of specific keys while leaving other rows fully editable. Useful when certain configuration keys must exist but their values can be changed, while the key itself should not be editable.

```php
KeyValue::make('config')
    ->label('Configuration')
    ->readonlyValueKeys(['api_endpoint', 'version'])
```

In this example, the `api_endpoint` and `version` keys will have their value inputs locked. All other keys remain fully editable.

---

## Masking sensitive values

Any row whose key matches `password`, `secret`, or `token` (case-insensitive) automatically
renders as a masked (`type="password"`) input with an eye icon to reveal/hide it while typing.
This is automatic — no field method needed to opt in.

```php
KeyValue::make('credentials')
    ->label('Credentials')
    ->keyPlaceholder('Key')
    ->valuePlaceholder('Value')
    // renders "client_secret" and "access_token" rows masked; "client_id" stays plain text
```

### Configuring the pattern

The default pattern (`password|secret|token`) lives in `config/vue-form-builder.php`
under `key_value.masked_key_pattern` — a plain regex source (no delimiters, matched
case-insensitively). Publish the config and change it to affect every `KeyValue`
field in the app:

```php
// config/vue-form-builder.php
'key_value' => [
    'masked_key_pattern' => 'password|secret|token|api_key',
],
```

Or override it for a single field with `->maskedKeyPattern(...)`, which takes
precedence over the config default:

```php
KeyValue::make('credentials')
    ->label('Credentials')
    ->keyPlaceholder('Key')
    ->valuePlaceholder('Value')
    ->maskedKeyPattern('password|secret|token|api_key|private_key')
```

### Editing an existing secret without re-sending it to the browser

Don't pass the real stored value for a sensitive key back down to the frontend — that
defeats the masking, since the value still ends up in the page's props/JSON payload
regardless of the input's `type`. Instead, send an empty string for that row and set
`hasStoredValue: true`, then pair it with `->maskedValuePlaceholder(...)` so the field
shows a hint instead of blank:

```php
KeyValue::make('credentials')
    ->valuePlaceholder('Value')
    ->maskedValuePlaceholder('Already set — leave blank to keep unchanged')
```

```php
// Controller: don't leak the real secret into the response
$values = collect($credential->values)->map(function ($value, $key) {
    $isSensitive = preg_match('/password|secret|token/i', $key);

    return [
        'key' => $key,
        'value' => $isSensitive ? '' : $value,
        'hasStoredValue' => $isSensitive && $value !== '',
    ];
})->values()->all();
```

On submit, a blank value for a sensitive key means "unchanged" — your controller/update
logic is responsible for falling back to the existing stored value when the submitted
value is empty, since the form itself has no way to distinguish "left blank on purpose"
from "cleared the secret".

---

## Pre-filling data

Pass an associative array via `fill()` on the `FormConfig`:

```php
ProductForm::make()
    ->fill([
        'metadata' => [
            'color' => 'blue',
            'size' => 'large',
        ],
    ])
```

Or fill from a model that has a cast:

```php
// In your model:
protected function casts(): array
{
    return [
        'metadata' => 'array',
    ];
}

// In your controller:
ProductForm::make()->fill($product)
```
