# Common Field Options

All field types inherit from `BaseField` and share the following methods.

## Label and placeholder

```php
Text::make('name')
    ->label('Full name')
    ->placeholder('Enter your name')
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

## CSS class

Adds CSS classes to the field wrapper element:

```php
Text::make('title')
    ->class('col-span-2')
```

## HTML attributes

Sets arbitrary HTML attributes on the underlying input element:

```php
Text::make('website')
    ->attributes([
        'data-validate' => 'url',
        'inputmode' => 'url',
    ])
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

Fields with an unsatisfied condition are hidden in the UI. Their values are not included in the form submission.
