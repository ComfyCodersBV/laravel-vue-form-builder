# WYSIWYG Field

A rich text editor field. The editor itself is resolved at runtime from a registry, so the package never imports an editor implementation and your build never inherits one.

```php
use TranquilTools\FormBuilder\Fields\Wysiwyg;

Wysiwyg::make('content')
    ->label('Content')
    ->rules('nullable', 'string')
```

---

## Registering an editor

An editor key only works once the matching component is registered in your app entrypoint (`resources/js/app.ts`). Register it once, use it in any form:

```ts
import QuillEditor from '@form-builder/wysiwyg/QuillEditor.vue';
import { registerWysiwygEditor } from '@form-builder/wysiwyg/registry';

registerWysiwygEditor('quill', QuillEditor);
```

Install the engine's own npm packages alongside it:

```bash
npm install vue-quilly quill
```

A field whose editor key is not registered renders a textarea instead of crashing. In development you also get a `console.warn` naming the missing key and every key that *is* registered.

### Available adapters

| Key | Engine | Licence | npm packages | Shipped |
|---|---|---|---|---|
| `textarea` | — | — | — | always available, no registration needed |
| `quill` | [Quill 2](https://quilljs.com) | BSD-3-Clause | `vue-quilly`, `quill` | `@form-builder/wysiwyg/QuillEditor.vue` |

Any other engine plugs in through the [adapter contract](wysiwyg-adapters). Only permissively licensed engines ship as first-party adapters.

---

## Choosing an editor

### Use a registered editor

```php
Wysiwyg::make('content')
    ->editor('quill')
```

### Use the textarea

Always available, no registration and no npm packages:

```php
Wysiwyg::make('content')
    ->editor('textarea')
```

The default editor is controlled by `config('form-builder.wysiwyg.default-editor')`. See [Configuration](../configuration).

---

## Customizing Quill options

Override the Quill configuration for a specific field:

```php
Wysiwyg::make('summary')
    ->label('Summary')
    ->options([
        'theme' => 'snow',
        'modules' => [
            'toolbar' => [
                ['bold', 'italic', 'underline'],
                [['list' => 'ordered'], ['list' => 'bullet']],
                ['clean'],
            ],
        ],
    ])
```

Options passed to `->options()` replace the defaults from the config file for this field instance.

To set global defaults for all `Wysiwyg` fields, publish and edit the config file:

```bash
php artisan vendor:publish --tag="laravel-form-builder-config"
```

See [Configuration → WYSIWYG](../configuration#wysiwyg) for the full options reference.

Whatever `->options()` contains is handed to the adapter as its `config` prop without being inspected. Its shape belongs to the engine you registered, not to this package.

### Quill themes

The adapter imports `quill/dist/quill.snow.css`, so the default `snow` theme works out of the box.
Any other theme needs its own stylesheet imported by your application — Quill ships the theme's
positioning and tooltip styling in that file, so without it a `bubble` editor renders an invisible
toolbar rather than no toolbar:

```ts
import 'quill/dist/quill.bubble.css';
```

```php
Wysiwyg::make('notes')
    ->editor('quill')
    ->options([
        'theme' => 'bubble',
    ])
```

### Quill source-view button

The bundled Quill adapter appends a button that swaps the editor for a raw HTML textarea. Turn it off per field:

```php
Wysiwyg::make('content')
    ->options([
        'showSourceButton' => false,
    ])
```
