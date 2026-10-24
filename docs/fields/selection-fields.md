# Selection Fields

## Select

A dropdown for selecting one or multiple options.

```php
use TranquilTools\FormBuilder\Fields\Select;

Select::make('country')
    ->label('Country')
    ->options([
        'nl' => 'Netherlands',
        'de' => 'Germany',
        'fr' => 'France',
    ])
    ->required()
```

### Populating from a model

```php
Select::make('category_id')
    ->label('Category')
    ->options(
        Category::query()->pluck('name', 'id')->toArray()
    )
    ->rules('nullable', 'exists:categories,id')
```

### Options from a collection of objects

When your options are a collection of objects (or arrays), specify which properties to use:

```php
Select::make('user_id')
    ->label('Assigned to')
    ->options(User::query()->get())
    ->optionLabel('full_name')   // default: 'name'
    ->optionValue('id')          // default: 'id'
```

### Multi-select

```php
Select::make('tags')
    ->label('Tags')
    ->options(Tag::query()->pluck('name', 'id')->toArray())
    ->multiple()
    ->rules('array')
```

### Searchable

Renders a combobox with a filter input instead of a plain dropdown. Not available combined with `->multiple()`.

```php
Select::make('country')
    ->label('Country')
    ->options(Country::query()->pluck('name', 'id')->toArray())
    ->searchable()
```

The search placeholder and "no results" text are translatable, see [Translations](#translations).

### Server-side search

When the list is too long or too private to send to the browser, give the select a search url instead of options. The
field renders the searchable combobox and fetches `GET {url}?q=<term>` 250 ms after the user stops typing, from
`minSearchLength` characters on (default `1`). The url answers with the matches only:

```json
[{"value": 5, "label": "Jane Doe"}, {"value": "group:2", "label": "Sales"}]
```

```php
Select::make('accessor')
    ->label('User or group')
    ->searchUrl(route('mailbox.settings.accessors', $mailbox))
    ->minSearchLength(2)
    ->selected($access?->accessor, $access?->accessor_name)
    ->rules('required', new ExistingAccessor)
```

- A select with a search url never sends its `options`, also when `->options()` was called.
- `->selected($value, $label)` sends the stored value with its label as `selected: {value, label}`, so an edit form
  shows the label without searching. Without a label the value itself is shown. `null` sends nothing. It only names
  the value: the field value itself still comes from the form defaults, as for any other field.
- The field adds no rule of its own, because the options are not known up front. Validate the value on the server with
  an `exists`-style rule.
- The request carries the session cookie and `Accept: application/json`, so a normal web route behind `auth` works.
  Check in that route that the user may see what it returns.
- Labels are rendered as text, never as HTML. A failing request shows "Searching failed, try again" ("Zoeken is mislukt,
  probeer het opnieuw"); below the minimum the list says "Type to search". The search input is named after its
  placeholder and the search state is announced through a polite live region.
- Not available combined with `->multiple()`: that throws a `LogicException`.

Requires `tranquil-tools/laravel-form-builder` 1.8 and `laravel-vue-form-builder` 1.13 or newer.

### Remote search

When the search needs more control than a url, hand the field a `search` function through `fieldOverrides`. The
field then renders the searchable combobox, calls `search(query)` 250 ms after the user stops typing and lists what it
returns, read through `optionLabel` / `optionValue` like static options. A function cannot travel in a PHP schema, so
the caller supplies it and keeps control over the request: authentication, base URL and response shape.

`minSearchLength` (default `1`) sets how many characters are needed before the first call. A stored value that is not
among the results is kept; pass its text as `selectedLabel` so the closed field shows a readable label instead of the
raw value.

```vue
<Form
    :schema="form"
    :field-overrides="{
        brand_id: {
            search: (query) => api.searchBrands(query),
            minSearchLength: 2,
            selectedLabel: record.brand?.name,
        },
    }"
/>
```

### Clearable

A single select keeps its value once something is picked, because a native select has no empty state to go back to. Pass `clearable` to add a button next to the dropdown that empties the field again. It works on a plain and on a searchable select, and is hidden while the field is empty, disabled or readonly.

```vue
<template>
    <Form
        :schema="form"
        :field-overrides="{ country_id: { clearable: true, clearLabel: 'Clear country' } }"
    />
</template>
```

---

## Checkbox

A single checkbox for boolean values. Defaults to submitting `'1'` when checked and `'0'` when unchecked. A checkbox nobody touches submits its `falseValue` as well, so a `NOT NULL` boolean column never receives the `null` that `ConvertEmptyStringsToNull` would otherwise make of an empty value.

```php
use TranquilTools\FormBuilder\Fields\Checkbox;

Checkbox::make('active')
    ->label('Status')
    ->checkboxLabel('This account is active')
    ->checked()
```

The label of a single checkbox sits next to the box, once. With a `checkboxLabel()` as well, the label goes above the
field and the `checkboxLabel()` next to the box.

**Methods:**

| Method | Description |
|---|---|
| `->checkboxLabel(string)` | Label displayed next to the checkbox itself (separate from the field label) |
| `->checked()` | Pre-checks the checkbox (sets default to `true`) |
| `->value(mixed)` | Value submitted when checked (default: `'1'`) |
| `->falseValue(mixed)` | Value submitted when unchecked (default: `'0'`) |

```php
Checkbox::make('newsletter')
    ->label('Email preferences')
    ->checkboxLabel('Subscribe to the newsletter')
    ->value(true)
    ->falseValue(false)
```

---

## Checkboxes

Multiple checkboxes from an options list. Submits an array of selected values.

```php
use TranquilTools\FormBuilder\Fields\Checkboxes;

Checkboxes::make('permissions')
    ->label('Permissions')
    ->options([
        'read' => 'Read',
        'write' => 'Write',
        'delete' => 'Delete',
    ])
    ->inline()
    ->rules('array')
```

**Methods:**

| Method | Description |
|---|---|
| `->options(array\|Collection)` | List of options |
| `->optionLabel(string)` | Property to use as label for object options (default: `'name'`) |
| `->optionValue(string)` | Property to use as value for object options (default: `'id'`) |
| `->inline()` | Display checkboxes horizontally instead of stacked vertically |
| `->buttons()` | Render options as toggle pill buttons instead of checkboxes |

---

## Radio / Radios

A group of radio buttons where only one can be selected.

```php
use TranquilTools\FormBuilder\Fields\Radio;

Radio::make('plan')
    ->label('Plan')
    ->options([
        'starter' => 'Starter',
        'pro' => 'Pro',
        'enterprise' => 'Enterprise',
    ])
    ->rules('required')
```

Use `->inline()` to display the options horizontally:

```php
Radio::make('gender')
    ->label('Gender')
    ->options(['m' => 'Male', 'f' => 'Female', 'x' => 'Other'])
    ->inline()
```

### Descriptions and links per option

An option given as an array can carry a `description` (shown as text under the label) and a link next to it, for an
action that belongs to that option:

```php
Radio::make('unit_id')
    ->label('Unit')
    ->options([
        ['value' => 1, 'label' => 'Main hall', 'description' => '120 seats', 'href' => route('units.move', 1), 'linkLabel' => 'Move'],
        ['value' => 2, 'label' => 'Attic', 'description' => '20 seats'],
    ])

// Keyed options work too
Radio::make('plan')->options([
    'pro' => ['label' => 'Pro', 'description' => 'Billed monthly', 'href' => '/plans/pro', 'linkLabel' => 'Compare'],
    'starter' => 'Starter',
])
```

Separate radios take `->description('...')` and `->link($href, $label)`.

A link opens in the same tab. Give an option a `target` to open it elsewhere, pass one as the third argument of
`->link()`, or open every link of the field in a new tab with `->openLinksInNewTab()` (an option with its own `target`
keeps it):

```php
Radio::make('unit_id')
    ->options([
        ['value' => 1, 'label' => 'Main hall', 'href' => route('units.show', 1), 'linkLabel' => 'View', 'target' => '_blank'],
    ])

Radio::make('plan')->value('pro')->label('Pro')->link('/plans/pro', 'Terms', Radio::NEW_TAB)

Radio::make('unit_id')->options($units)->openLinksInNewTab()
```

A link with a target other than `_self` renders as a plain anchor with `rel="noopener noreferrer"`, also when it starts
with `/`. Requires `tranquil-tools/laravel-form-builder` 1.5 and `laravel-vue-form-builder` 1.8 or newer.

Descriptions and link labels are rendered as text, never as HTML. A link only renders for a relative URL or an
`http`, `https`, `mailto` or `tel` URL; anything else (`javascript:`, `data:`, …) is dropped by the core and ignored by
the renderer. A link starting with `/` navigates through Inertia, unless it has a target.

`Radios` is an alias for `Radio` — both behave identically.

---

## Toggle

A toggle switch for boolean values. Behaves like a `Checkbox` but renders as a sliding toggle. Its label sits next to
the switch, once.

```php
use TranquilTools\FormBuilder\Fields\Toggle;

Toggle::make('notifications_enabled')
    ->label('Notifications')
    ->on('Enabled')
```

**Methods:**

| Method | Description |
|---|---|
| `->on(string)` | Label displayed when toggle is on |
| `->value(mixed)` | Value submitted when toggled on (default: `'1'`) |
| `->falseValue(mixed)` | Value submitted when toggled off (default: `'0'`) |

```php
Toggle::make('is_public')
    ->label('Visibility')
    ->on('Public')
    ->value(true)
    ->falseValue(false)
```

## Translations

The searchable `Select` combobox text is translatable. Publish the language files or add entries to your
`lang/vendor/vue-form-builder/` directory:

| Key                                          | Default (en)     |
|-----------------------------------------------|------------------|
| `vue-form-builder::fields.search-placeholder` | Search...        |
| `vue-form-builder::fields.no-results`         | No results       |
| `vue-form-builder::fields.choose-option`      | Choose an option |
