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
