# Common Field Options

All field types inherit from `BaseField` and share the following methods.

## Label and placeholder

```php
Text::make('name')
    ->label('Full name')
    ->placeholder('Enter your name')
```

## Hidden label

`->hideLabel()` hides the label visually but keeps it for screen readers (`sr-only`), on every field type. Use it when
the context already says what a field is, such as a search box above a table:

```php
Text::make('q')
    ->label('Search bookings')
    ->placeholder('Search…')
    ->hideLabel()
```

In a horizontal layout a field with a hidden label drops the label column.

## Column span

In a form or section with columns, `->columnSpan(n)` lets a field take `n` columns and `->columnSpanFull()` the whole
row. See [Columns](../columns.md).

```php
Text::make('street')->columnSpan(2)
Textarea::make('notes')->columnSpanFull()
```

## Column width

`->columnWidth('8rem')` sets the width of the field's column in a [repeater table](repeater.md#table). It takes a
number with `px`, `rem`, `em`, `ch` or `%`, such as `0.5rem` (not `.5rem` or `0`); anything else throws an `InvalidArgumentException`. Other layouts ignore it.

```php
Number::make('hanks')->label('Hanks')->columnWidth('6rem')
```

## Default value

Sets the initial value when the form loads (before any `fill()` data):

```php
Select::make('status')
    ->default('active')

Number::make('quantity')
    ->default(1)
```

## Required

Marks the field as required in the UI and adds the `required` validation rule:

```php
Text::make('email')
    ->required()

// Pass false to make it explicitly optional
Text::make('nickname')
    ->required(false)
```

### The required asterisk

Every field whose rules contain `required` gets an asterisk after its label, with a hidden "(required)" /
"(verplicht)" for screen readers (the `required` message, see [Translations](../vue-usage.md#translations)). This holds
for `->required()` and `->rules('required|...')` alike, also for radio and checkbox groups, toggles and single
checkboxes. A `Rule::requiredIf()` counts only when its condition is a plain `true`; a closure, `required_if`,
`required_with` and the like are not marked, because the field is not always required. Sections and steps get no
asterisk. A translatable field marks the locales that are required.

Override it per field:

```php
Text::make('phone')
    ->rules('required_if:contact,phone')
    ->markRequired()        // marked although the rule is conditional

Text::make('reference')
    ->required()
    ->markRequired(false)   // never marked
```

The asterisk is on by default for the whole app. Switch the derived marking off in `config/form-builder.php`;
`->markRequired()` on a field still applies then:

```php
'required_indicator' => false,
```

In Vue, `fieldOverrides` takes `markRequired` too, for example `{ phone: { markRequired: true } }`. The classes of the
asterisk are the `required` theme key, see [Theming](../theming.md).

## Validation rules

Add any Laravel validation rules. Rules can be passed as separate string arguments, a pipe-separated string, or an array:

```php
Text::make('slug')
    ->rules('required', 'string', 'max:100', 'unique:products,slug')

Number::make('price')
    ->rules(['required', 'numeric', 'min:0'])

Text::make('code')
    ->rules('required|alpha_num|size:6')
```

## Help text

Displays a help message below the field. Accepts a plain string or an `HtmlString` for HTML content:

```php
use Illuminate\Support\HtmlString;

Text::make('username')
    ->help('Only letters, numbers, and underscores.')

Text::make('api_key')
    ->help(new HtmlString('Find your key in the <a href="/settings">settings</a>.'))
```

A plain string is escaped and then rendered as HTML. To render the help as plain text instead, with its line breaks
kept, use `->helpText()` or `->help($text, html: false)`:

```php
Text::make('note')
    ->helpText("Shown to the renter.\nNo markup: <b> stays <b>.")
```

The schema then carries `helpText`, which the renderer shows as text (and an escaped `help` for older renderers).
Text computed in the browser goes through `fieldOverrides` the same way, so it never needs escaping by hand:

```vue
<Form :schema="form" :field-overrides="{ house_number: { helpText: `Found: ${address}` } }" />
```

## Disabled and readonly

```php
Text::make('created_at')
    ->disabled()     // Grayed out, value excluded from submission

Text::make('reference')
    ->readonly()     // Visible and included in submission, but not editable
```

Both accept a boolean argument — useful for conditional logic:

```php
->disabled($user->cannot('edit'))
->readonly($isLocked)
```

## CSS classes

A field has two class hooks: the wrapper around the label, control, help and error, and the control itself.

```php
Text::make('title')
    ->wrapperClass('col-span-2')
    ->inputClass('font-mono uppercase')
```

- `->wrapperClass('...')` replaces the wrapper's classes (the theme's `wrapper`) outright. Use
  `->theme(['wrapper' => '...'])` to add to them instead, see [Theming](../theming.md).
- `->class('...')` is the older name of `->wrapperClass()` and keeps working exactly as before.
- `->inputClass('...')` adds classes to the element itself: the input, textarea, the trigger of a select or date field,
  the checkbox, each checkbox or radio of a group, each radio tile, the switch of a toggle, the box of a tags field, the
  key and value inputs of a key-value field, every locale of a translatable field, the editor of a WYSIWYG field and the
  button of a `Button`, `Submit` or `DeleteButton`. The classes merge with the defaults, and on most elements a
  conflicting utility wins: `->inputClass('h-12')` replaces the default `h-9` of an input. Hidden and reCAPTCHA fields
  ignore it.
- Buttons have no wrapper, so on a button both land on the button.

From Vue the same goes through `fieldOverrides` with `wrapperClassName` and `inputClassName`:

```vue
<Form :schema="form" :field-overrides="{ title: { wrapperClassName: 'col-span-2', inputClassName: 'font-mono' } }" />
```

The schema key of the wrapper class stays `className`, so a form built with an older laravel-form-builder renders the
same. `inputClass()` needs laravel-form-builder 1.13; an older renderer ignores it.

## HTML attributes

Sets arbitrary HTML attributes on the underlying input element:

```php
Text::make('website')
    ->attributes([
        'data-validate' => 'url',
        'inputmode' => 'url',
    ])
```

Event listeners and Vue bindings cannot come from PHP. A key starting with `@`, `:`, `v-on:` or `v-bind:` throws an
`InvalidArgumentException`; attach the handler in Vue instead, see
[Click and other event handlers](../vue-usage.md#click-and-other-event-handlers):

```vue
<Form :schema="form" :field-overrides="{ website: { onBlur: checkWebsite } }" />
```

## Conditional visibility

Show or hide a field based on the current form state. Pass a JavaScript expression that is evaluated in the Vue component. The expression has access to each field's value by its name:

```php
// Show when the 'active' toggle is true
Text::make('activation_date')
    ->if('active === true')

// Show only when role is 'admin'
Select::make('permissions')
    ->if('role === "admin"')

// Show when a number exceeds a threshold
Textarea::make('notes')
    ->if('quantity > 10')

// Combine conditions
Text::make('vat_number')
    ->if('country === "NL" && is_business === true')
```

On a form with dotted field names, `address.city` reads the field `address.city` as a nested value and
`form['address.city']` reads it by its full name. A field name that is no JavaScript identifier, or a reserved word
such as `class`, is only reachable through `form`. `form` always means the form itself, also when a field is named
`form`. A condition that throws counts as false and hides its field; during
development the console shows a warning with the error.

A [Display](display.md) field takes an expression in the same language through `->expression()` to show a
computed value.

Fields with an unsatisfied condition are hidden in the UI. Their values are not included in the form submission.
