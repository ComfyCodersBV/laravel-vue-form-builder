# Money

A `Money` field edits an amount as a localised decimal with its currency symbol, and stores it as a whole number of
minor units (cents). `€ 1.234,50` on screen is `123450` in the form data, in the request and in your database column.

```php
use TranquilTools\FormBuilder\Fields\Money;

Money::make('price_cents')
    ->label('Price')
    ->currency('EUR')
    ->required()
    ->unsigned()
```

| Method | Description |
|---|---|
| `->currency(string)` | ISO 4217 code. Defaults to `config('form-builder.money.currency')`, `EUR` out of the box |
| `->locale(?string)` | Locale for separators and the symbol position (`nl`, `en-US`). Defaults to the form locale |
| `->decimals(int)` | Minor-unit digits. Follows the currency (`JPY` 0, `KWD` 3, most others 2) |
| `->minValue(int\|float)` | Lowest amount, in major units: `->minValue(0.5)` validates `min:50` |
| `->maxValue(int\|float)` | Highest amount, in major units |
| `->unsigned()` | Shortcut for `->minValue(0)`; the input then refuses a minus sign |

## Validation

The field validates `integer` (plus your own rules and the bounds) and is `nullable` unless `->required()`.
`FormConfig::validate()` and `normalizeValues()` hand back an `int` or `null`:

```php
$validated = ProductForm::make()->validate($request);

$product->price_cents = $validated['price_cents']; // 123450
```

Laravel's own messages for the bounds speak in minor units ("must not be greater than 100000"). Pass a message of
your own when that shows: `->validate($request, ['price_cents.max' => 'At most € 1.000,00.'])`.

`toMinorUnits()` and `toMajorUnits()` convert with the decimals of the field's currency, for a value you show elsewhere:

```php
$field = Money::make('price_cents')->currency('EUR');

$field->toMinorUnits('12.34'); // 1234
$field->toMajorUnits(1250);    // 12.5
```

## Typing

The input accepts what people type in their own locale. In Dutch `12,5`, `12.50` and `€ 12,50` all become `1250`;
`1.250` is read as twelve hundred and fifty, because three digits after a point is a thousands separator. On blur the
amount is formatted back (`12,50`). Text that is no amount stays as typed, is marked invalid and fails the `integer`
rule on the server.
