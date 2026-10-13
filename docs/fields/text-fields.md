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

### A stored value

A password, API key or secret is never sent back to the browser, so the field cannot show it. `->stored()` says a
value exists: the input gets a masked placeholder and a hint that leaving it empty keeps the stored value.
`->removable()` adds a "Remove the stored value" checkbox that submits a flag, like the [File field](file.md):

```php
Password::make('api_key')
    ->label('API key')
    ->stored(filled($settings->api_key))
    ->removable()
    ->rules('nullable', 'string', 'max:255')
```

The flag is `remove_{name}` unless you pass one (`->removable(true, 'forget_api_key')`), gets a `nullable|boolean` rule,
and is read back with `removalRequested()`:

```php
if ($request->boolean('remove_api_key')) {
    $settings->api_key = null;
} elseif ($request->filled('api_key')) {
    $settings->api_key = $request->input('api_key');
}
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
| `->stepper()` | Adds increment/decrement buttons around the input |

### Stepper

```php
Number::make('quantity')
    ->label('Quantity')
    ->minValue(0)
    ->step(1)
    ->stepper()
```

The increment/decrement buttons respect `minValue`/`maxValue` and are disabled together with the field.
Their `aria-label`s are translatable, see [Translations](#translations).

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

A native color picker next to a text input, so a value can be picked or typed. The text input is the value that gets submitted; the picker falls back to `#000000` while the typed value is not yet a complete `#rrggbb`.

```php
use TranquilTools\FormBuilder\Fields\Color;

Color::make('brand_color')
    ->label('Brand color')
    ->default('#3b82f6')
```

### Swatches

Pass `swatches` to show a row of preset colors under the input. Clicking one fills the field, and the selected swatch is marked with a ring.

```vue
<template>
    <Form
        :schema="form"
        :field-overrides="{ brand_color: { swatches: ['#3b82f6', '#ef4444', '#22c55e'] } }"
    />
</template>
```

---

## Tags

A list of short values as chips, such as labels or e-mail addresses. The value is an array of strings.

```php
use TranquilTools\FormBuilder\Fields\Tags;

Tags::make('to')
    ->label('To')
    ->emails()
    ->suggestions(route('mailbox.addresses'))
    ->max(10)
    ->required()
```

- Typing a comma or semicolon, pressing Enter or Tab, or leaving the field turns the text into a chip. A pasted list
  is split on commas, semicolons and newlines. Backspace and the arrow keys select and remove chips.
- `->emails()` marks chips that are no e-mail address in the browser and validates every entry with `email:rfc`
  (rule `to.*`). Without it any text is accepted.
- `->suggestions($url)` fetches `GET {url}?q=...` while typing (debounced) and expects `[{ "value": "...", "label": "..." }]`.
  The arrow keys move through the list and Enter picks the highlighted suggestion. The field works without it.
- `->max(int)` limits the number of chips and adds a `max:` rule.
- The field is `nullable` and `array` unless `->required()`. `FormConfig::validate()` and `normalizeValues()` also accept
  a comma, semicolon or newline separated string, so values stored by a former `Text` field keep working; `fill()` with
  such a string shows it as chips. A FormRequest using `rules()` gets the array rules and needs an array.
- Each entry is named after the label in validation messages: "The To field must be a valid email address."

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

## Translations

The stepper button labels on the `Number` field are translatable. Publish the language files or add entries to your
`lang/vendor/vue-form-builder/` directory:

| Key                                    | Default (en) |
|-----------------------------------------|--------------|
| `vue-form-builder::fields.decrement`    | Decrease     |
| `vue-form-builder::fields.increment`    | Increase     |
