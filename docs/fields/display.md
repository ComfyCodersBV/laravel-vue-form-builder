# Display

A read-only field that shows a value next to the inputs of a form, with a label and help like any other field. It is
never part of the payload and gets no validation rules, also when you add some, so it is safe for previews and
computed values.

```php
use TranquilTools\FormBuilder\Fields\Display;

Text::make('prefix')->label('Prefix'),
Text::make('number')->label('Number'),

Display::make('name_preview')
    ->label('Lot name')
    ->expression('prefix && number ? `${prefix}-${number}` : ""')
    ->help('This is how the lot will be named.')

Display::make('created_by')
    ->label('Created by')
    ->content($lot->creator->name)
```

**Methods:**

| Method | Description |
|---|---|
| `->content(string\|int\|float\|Stringable\|null)` | A fixed value, such as one from the server |
| `->expression(string)` | A JavaScript expression that computes the value from other fields, see below |

- `->expression()` uses the language of [`->if()`](common-options.md#conditional-visibility): each field value by its
  name, and `form` for all of them. Inside a repeater it reads the fields of its own row. The result is shown as text;
  `null`, `undefined`, `false`, `NaN` and an expression that fails show nothing; during development the console shows
  a warning with the error. Dotted field names work as nested values (`address.city`).
- Without an expression the field shows its `->content()`. Both are rendered as text, never as HTML.
- The value sits in an `<output>` with the field id, so the label points at it and a screen reader announces changes.
- The renderer leaves the field out of the form data, also when the form defaults carry its name, and out of repeater
  rows. `FormConfig::getRules()` and `validate()` skip it, in sections and repeaters too.

Requires `tranquil-tools/laravel-form-builder` 1.19 and `laravel-vue-form-builder` 1.24 or newer.
