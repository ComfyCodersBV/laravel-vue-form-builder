# Sections

A `Section` structures a long form: a heading, an optional description and the fields that belong under it. It is a
layout element, not a field: it holds no value and submits nothing of its own.

```php
use TranquilTools\FormBuilder\Fields\Section;

public function fields(): array
{
    return [
        Section::make()
            ->title('Contact details')
            ->description('We only use these to confirm the booking.')
            ->fields([
                Text::make('name')->required(),
                Email::make('email')->required(),
            ]),

        Section::make()
            ->title('Stay')
            ->fields([
                Date::make('arrival_on')->required(),
                Number::make('guests')->rules('integer', 'min:1'),
            ]),

        Submit::make(),
    ];
}
```

- The fields inside a section are ordinary top-level fields: they keep their own names, their rules end up in
  `getRules()` and `validate()`, and `fill()` fills them.
- `->description()` escapes a string; pass an `HtmlString` for markup, like `->help()`.
- A section without fields is a plain heading between other fields.
- Sections can be nested, and conditions (`->if()`) work on a section and across sections.
- In a two-column form a section spans both columns and lays out its own fields in two columns, unless it sets its own
  `->columns()`.
- `->class('...')` replaces the classes of the section element (default `space-y-4`).

## Columns

`->columns(n)` puts the fields of a section side by side, in up to four columns. Below the `md` breakpoint they stack
in a single column again. A field takes more than one column with `->columnSpan(n)`, or the whole row with
`->columnSpanFull()`:

```php
Section::make()
    ->title('Address')
    ->columns(3)
    ->fields([
        Text::make('street')->columnSpan(2),
        Text::make('number'),
        Text::make('postcode'),
        Text::make('city')->columnSpan(2),
        Textarea::make('directions'),   // a textarea spans the row by default
    ]),
```

- A span larger than the number of columns is cut back to the full row.
- Textareas, WYSIWYG editors, repeaters, key-value fields, buttons, hidden fields and nested sections take the full row
  unless they set a `->columnSpan()` of their own.
- A nested section without `->columns()` uses the columns of the section around it; `->columns(1)` stacks its fields
  again.

See [Columns](../columns.md) for columns on the whole form.

Requires `tranquil-tools/laravel-form-builder` 1.5 and `laravel-vue-form-builder` 1.8 or newer.
