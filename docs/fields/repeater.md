# Repeater

A repeatable group of sub-fields — for example ingredient rows or preparation
steps. Each row renders the sub-fields you pass to `->fields([...])`, and the
value is submitted as an array of objects.

```php
use TranquilTools\FormBuilder\Fields\Number;
use TranquilTools\FormBuilder\Fields\Repeater;
use TranquilTools\FormBuilder\Fields\Text;

Repeater::make('ingredients')
    ->label('Ingredients')
    ->addActionLabel('Add ingredient')
    ->itemLabel('Ingredient')
    ->reorderable()
    ->min(1)
    ->fields([
        Number::make('amount')
            ->placeholder('Amount')
            ->rules(['nullable', 'numeric', 'min:0']),

        Text::make('unit')
            ->placeholder('Unit')
            ->rules(['nullable', 'string', 'max:50']),

        Text::make('name')
            ->placeholder('Name')
            ->rules(['required', 'string', 'max:255']),
    ]);
```

Prefer simple input sub-fields (text, number, select, textarea, toggle). The row
value is a plain object keyed by each sub-field `name`.

### Inline rows

`->inline()` renders each row as one line: the sub-fields side by side in equal columns with the row actions at the
end, without the numbered card. On small screens a row stacks its sub-fields in a bordered card again.

### Errors per row

Server errors of a row, such as `ingredients.1.name`, show under that sub-field in that row.

---

## Validation

The sub-field rules are expanded into dotted, wildcard validation rules, so the
example above contributes the following to `Form::rules()`:

```php
[
    'ingredients' => ['array'],
    'ingredients.*.amount' => ['nullable', 'numeric', 'min:0'],
    'ingredients.*.unit' => ['nullable', 'string', 'max:50'],
    'ingredients.*.name' => ['required', 'string', 'max:255'],
]
```

---

## Methods

| Method                     | Description                                                   |
|----------------------------|---------------------------------------------------------------|
| `->fields(array)`          | Sub-fields rendered in each row                               |
| `->addActionLabel(string)` | Label for the "add row" button                                |
| `->itemLabel(string)`      | Singular label for a row (used in headings/actions)           |
| `->min(int)`               | Minimum number of rows                                        |
| `->max(int)`               | Maximum number of rows                                        |
| `->addable(bool)`          | Allow adding rows (default: `true`)                           |
| `->deletable(bool)`        | Allow removing rows (default: `true`)                         |
| `->reorderable(bool)`      | Allow drag-to-reorder rows (default: `false`)                 |
| `->inline(bool)`           | Render each row as one line of sub-fields instead of a card   |
