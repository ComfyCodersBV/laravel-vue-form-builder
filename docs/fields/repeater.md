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
end, without the numbered card. On small screens a row stacks its sub-fields in a bordered card again. Every row repeats
the labels; for many rows use a table instead.

### Table

`->table()` renders the rows as a table: the labels once in a header row, one row per item and the row actions in the
last column. It suits long lists, such as 200 barrels of seven columns each.

```php
Repeater::make('barrels')
    ->label('Barrels')
    ->table()
    ->fields([
        Text::make('number')->label('Barrel')->columnWidth('6rem')->required(),
        Number::make('hanks')->label('Hanks')->columnWidth('6rem'),
        Select::make('caliber')->label('Caliber')->columnWidth('9rem')->options($calibers),
        Text::make('remark')->label('Remark'),
    ]);
```

- `->columnWidth()` on a sub-field sets the width of its column. A column without it takes an equal part of the space
  that is left, and at least `8rem`. The table never gets narrower than the sum of its columns: on a narrow screen it
  scrolls sideways inside its own box instead of squeezing the fields, so a select stays inside its cell.
- The header shows the label, the required asterisk and the help of each sub-field. In the rows each field keeps a
  visually hidden label with the same text, so a screen reader still names every input, and the input points at the
  help in the header with `aria-describedby`.
- The actions column has a visually hidden "Actions" header, and each remove button is named after its row, such as
  "Remove row 3" (messages `actions` and `removeRow`).
- An error of a row, such as `barrels.3.number`, shows under that cell.
- Hidden sub-fields get no column; they sit in the actions cell of their row.
- A sub-field whose `->if()` does not hold leaves its cell in that row empty; the column and its header stay, so the
  other columns keep their place. The condition sees the other sub-fields of the same row. With
  `->if('kind', 'full')` the hidden value is also left out of that row in the payload, and the rule becomes
  `exclude_unless:barrels.*.kind,full`, so the server checks each row against its own `kind`.
- `->table()` wins over `->inline()`. Without rows there is no table, only the empty text and the add button.

### Row keys

Each row gets a key in the browser that stays with it when rows are added, removed or reordered, so the inputs, an open
select and the like stay on the row they belong to. The key lives only in the renderer: it is not part of the value,
not submitted and not validated. The field ids stay based on the position of the row (`{form id}-{repeater}-{row}-{field}`),
so they match the error keys of the server, such as `barrels.3.number`.

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
| `->table(bool)`            | Render the rows as a table with one header row                |
