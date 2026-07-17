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

---

## Checkbox

A single checkbox for boolean values. Defaults to submitting `'1'` when checked and `'0'` when unchecked.

```php
use TranquilTools\FormBuilder\Fields\Checkbox;

Checkbox::make('active')
    ->label('Status')
    ->checkboxLabel('This account is active')
    ->checked()
```

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

`Radios` is an alias for `Radio` — both behave identically.

---

## Toggle

A toggle switch for boolean values. Behaves like a `Checkbox` but renders as a sliding toggle.

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
