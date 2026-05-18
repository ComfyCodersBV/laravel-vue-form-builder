# File Upload Fields

## File

A file upload input.

```php
use TranquilTools\FormBuilder\Fields\File;

File::make('avatar')
    ->label('Profile picture')
    ->accept('image/jpeg', 'image/png', 'image/webp')
    ->rules('nullable', 'max:2048')
```

## Files

Multiple file upload — equivalent to `File::make()->multiple()`.

```php
use TranquilTools\FormBuilder\Fields\Files;

Files::make('attachments')
    ->label('Attachments')
    ->accept('application/pdf', 'image/*')
    ->rules('array')
```

---

## Options

### Accept

Restrict which file types can be selected. Pass MIME types as separate string arguments. This sets the `accept` attribute on the input and automatically adds a `mimetypes:` validation rule:

```php
File::make('document')
    ->accept('application/pdf')

File::make('image')
    ->accept('image/jpeg', 'image/png', 'image/gif', 'image/webp')
```

### Multiple

Allow selecting more than one file at a time:

```php
File::make('photos')
    ->multiple()
```

`Files` is a shorthand for `File::make()->multiple()`.

---

## Notes

- The component emits `File` objects (not strings) when a file is selected, so Inertia handles the upload as a multipart form.
- Combine with Laravel's `max:` rule (kilobytes) and `dimensions:` rule as needed:

```php
File::make('logo')
    ->accept('image/png', 'image/svg+xml')
    ->rules('max:1024', 'dimensions:min_width=100,min_height=100')
```
