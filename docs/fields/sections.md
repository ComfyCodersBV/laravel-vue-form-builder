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
- In a two-column form a section spans both columns and lays out its own fields in two columns.
- `->class('...')` replaces the classes of the section element (default `space-y-4`).
