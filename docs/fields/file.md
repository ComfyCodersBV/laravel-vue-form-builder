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

### Current file

Show the file that is stored now, so an edit form tells the user what they would replace:

```php
File::make('avatar')
    ->current($user->avatar_url)

File::make('contract')
    ->current(Storage::url($order->contract_path), 'Contract.pdf')
```

The name defaults to the last segment of the URL. A URL ending in an image extension (`jpg`, `png`, `webp`, `svg`, …)
or a `data:image/` URL gets a thumbnail; `->preview(false)` keeps it to the link.

### Removing the current file

`->removable()` adds a "Remove current file" checkbox under the current file. It submits a boolean flag, named
`remove_{field}` unless you pass another name, and adds a `nullable|boolean` rule for it:

```php
File::make('avatar')
    ->current($user->avatar_url)
    ->removable() // submits remove_avatar

File::make('avatar')
    ->removable(true, 'delete_avatar')
```

Read it back in the controller with `$request->boolean('remove_avatar')`, or let the field read it:

```php
if (File::make('avatar')->removable()->removalRequested($request)) {
    Storage::delete($user->avatar_path);
}
```

### A list of current files

`Files::current()` also takes a list of stored files. Each entry needs a `key` and a `name`; `size` (bytes) and `url`
are optional. A missing `key` falls back to the position in the list, a missing `name` to the file name in the `url`.

```php
Files::make('attachments')
    ->current([
        ['key' => '0', 'name' => 'offerte.pdf', 'size' => 81234, 'url' => $url],
        ['key' => '1', 'name' => 'voorwaarden.pdf'],
    ])
    ->removable()
```

The renderer lists the files above the upload input, each with its own remove toggle. With `removable()` the flag
(`remove_attachments` by default) becomes a list of keys: it posts `remove_attachments[]`, validates with `nullable`,
`array` and `in:` the listed keys, and is read back with `removedKeys()`:

```php
$field = Files::make('attachments')->current($files)->removable();

foreach ($field->removedKeys($request) as $key) {
    // delete the attachment stored under $key
}
```

`removalRequested()` is `true` as soon as one key is posted. A single `File::current($url, $name)` keeps its boolean
flag, and `removedKeys()` returns `[]` for it.

---

## Notes

- A form with a file and the method `PUT`, `PATCH` or `DELETE` is sent as a `POST` with `_method` set, because PHP
  does not parse a multipart body on any other method. Laravel routes it to the `put`/`patch`/`delete` route as usual.
  This happens only while a file is actually selected; without one the form keeps its own method.
- After a successful submit the field forgets the chosen file and empties the input, and the remove checkbox unticks,
  so a second submit does not upload the same file again.
- The component emits `File` objects (not strings) when a file is selected, so Inertia handles the upload as a multipart form.
- File fields are never seeded with an existing stored value (e.g. a filename from `fill()`). Submitting the form without choosing a new file sends an empty value, so a `mimetypes:` rule won't fail against a leftover string. Use a `nullable` rule when the file is optional on update.
- Combine with Laravel's `max:` rule (kilobytes) and `dimensions:` rule as needed:

```php
File::make('logo')
    ->accept('image/png', 'image/svg+xml')
    ->rules('max:1024', 'dimensions:min_width=100,min_height=100')
```
