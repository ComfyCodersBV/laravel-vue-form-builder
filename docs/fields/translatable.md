# Translatable

A `Translatable` field holds one value per locale, for content stored as JSON (spatie/laravel-translatable and
friends). It renders a tab per locale, each with the field you choose, and submits an object:

```php
use TranquilTools\FormBuilder\Fields\Textarea;
use TranquilTools\FormBuilder\Fields\Translatable;

Translatable::make('description')
    ->label('Description')
    ->locales(['nl', 'en'])
    ->field(Textarea::class)
    ->required()
```

```json
{ "description": { "nl": "Welkom", "en": "Welcome" } }
```

| Method | Description |
|---|---|
| `->locales(array)` | Locale codes, in tab order. Defaults to `config('form-builder.translatable.locales')`, else the app locale |
| `->localeLabels(array)` | Tab labels per code (`['nl' => 'Nederlands']`). Defaults to the upper-cased code |
| `->defaultLocale(string)` | The locale `->required()` applies to and the tab that opens first. Defaults to the app locale when listed, else the first |
| `->field(BaseField\|class-string)` | The input per locale: `Text` (default), `Textarea`, `Wysiwyg`, `Number`, `Money`, … Pass an instance to configure it: `->field(Text::make()->maxLength(80))` |
| `->required()` | Requires the default locale only |
| `->requiredLocales(array)` | Requires exactly these locales |
| `->stacked()` | Shows all locales below each other, labelled by locale, instead of tabs |

## Validation

The field validates `array`, and each locale on its own key with the rules of the inner field:

```php
Translatable::make('title')
    ->locales(['nl', 'en'])
    ->field(Text::make()->maxLength(80))
    ->required()
    ->getRules();   // ['required', 'array']

// nested rules collected by FormConfig::getRules()
// 'title.nl' => ['required', 'max:80']
// 'title.en' => ['nullable', 'max:80']
```

A `required()` on the inner field requires every locale. Errors land on `title.nl` and `title.en`; the renderer shows
each under its own input and marks the tab of a locale with an error, so a missing translation on a closed tab is
not missed.

### Friendly attribute names

Laravel names an error after its key, which reads as "The title.en field is required.". The form therefore gives every
locale input an attribute name made of the label and the locale name: "The Title (English) field is required.", or
"Title (Engels)" when the app runs in Dutch. `FormConfig::validate()` and `AbstractForm::validate()` pass them on by
themselves; a FormRequest returns them from `attributes()`:

```php
public function attributes(): array
{
    return ProductForm::attributes();
}
```

`make:form-request` generates that method from 1.5 on. `$form->getAttributes()` returns the same array, and attributes
you pass to `validate()` win over it: `->validate($request, [], ['title.nl' => 'Dutch title'])`.

Locale names come from `config('form-builder.translatable.locale_names')` (`['nl' => 'Vlaams']`) when set, then from
the package translations (English and Dutch names of about twenty languages), then from PHP's `intl` extension, and
finally the upper-cased code. Change the format through `form-builder::fields.translatable-attribute`
(`:label (:locale)`). A field without a label uses its name.

After validation the value holds exactly the configured locales (missing ones as `null`, unknown ones dropped), each
normalised by the inner field, so a `Money` per locale comes back as integers.

## Values

A stored object loads per locale. A plain string — a column that was not translatable yet — loads into the default
locale.
