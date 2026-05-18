# Text Fields

## Text

A standard single-line text input.

```php
use TranquilTools\FormBuilder\Fields\Text;

Text::make('name')
    ->label('Name')
    ->required()
    ->maxLength(255)
```

**Methods:**

| Method | Description |
|---|---|
| `->maxLength(int)` | Sets `maxlength` attribute and adds `max:N` rule |
| `->minLength(int)` | Sets `minlength` attribute and adds `min:N` rule |
| `->type(string)` | Sets the HTML `type` attribute (e.g. `'url'`, `'tel'`) |
| `->email()` | Shorthand for `->type('email')` |
| `->password()` | Shorthand for `->type('password')` |

## Email

A text input pre-configured as `type="email"`. Equivalent to `Text::make()->email()`.

```php
use TranquilTools\FormBuilder\Fields\Email;

Email::make('email')
    ->label('Email address')
    ->required()
```

## Password

A text input pre-configured as `type="password"`.

```php
use TranquilTools\FormBuilder\Fields\Password;

Password::make('password')
    ->label('Password')
    ->required()
    ->minLength(8)
```

## Number

A numeric input with optional min, max, and step constraints.

```php
use TranquilTools\FormBuilder\Fields\Number;

Number::make('price')
    ->label('Price')
    ->minValue(0)
    ->maxValue(9999)
    ->step(0.01)
```

**Methods:**

| Method | Description |
|---|---|
| `->minValue(int\|float)` | Sets `min` attribute and adds `min:N` rule |
| `->maxValue(int\|float)` | Sets `max` attribute and adds `max:N` rule |
| `->step(int\|float)` | Sets `step` attribute |
| `->unsigned()` | Shorthand for `->minValue(0)` |

## Textarea

A multi-line text input.

```php
use TranquilTools\FormBuilder\Fields\Textarea;

Textarea::make('description')
    ->label('Description')
    ->placeholder('Write a short description...')
    ->rules('nullable', 'string', 'max:2000')
```

## Color

A color picker input.

```php
use TranquilTools\FormBuilder\Fields\Color;

Color::make('brand_color')
    ->label('Brand color')
    ->default('#3b82f6')
```

---

## Shared options: prepend, append, tooltip, autocomplete

Text, Email, Password, Number, and Color fields support these additional options via the `HasTextfieldOptions` trait.

### Prepend and append

Display text or an icon before or after the input:

```php
Text::make('website')
    ->prepend('https://')

Number::make('price')
    ->prepend('€')
    ->append('per unit')
```

### Tooltip

Show a tooltip icon next to the field label. Pass a string or an array:

```php
Text::make('slug')
    ->tooltip('Used in the URL. Only lowercase letters and hyphens.')

Text::make('api_key')
    ->tooltip([
        'title' => 'API Key',
        'content' => 'Keep this secret. Regenerate if compromised.',
    ])
```

### Autocomplete

Control browser autocomplete behavior:

```php
Text::make('username')
    ->autocomplete(false)      // Sets autocomplete="off"

Text::make('email')
    ->autocomplete(true)       // Sets autocomplete="on"

Text::make('new_password')
    ->autocomplete('new-password')  // Sets exact autocomplete value
```
