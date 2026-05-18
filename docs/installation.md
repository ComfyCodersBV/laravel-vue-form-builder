# Installation

## Requirements

- PHP 8.2+
- Laravel 11, 12, or 13
- Vue 3 with Inertia.js

## 1. Install via Composer

```bash
composer require tranquil-tools/laravel-vue-form-builder
```

The service provider is auto-discovered. No manual registration needed.

## 2. Install frontend dependencies

The package requires [Reka UI](https://reka-ui.com) for its Vue components. Because Vite resolves imports from your app's `node_modules`, it must be installed in your project even though it's listed as a dependency of the package:

```bash
npm install reka-ui
```

## 3. Install WYSIWYG editor dependencies

```bash
npm install vue-quilly quill quill-image-resize-module
```

## 4. Add the Vite alias

Add the `@form-builder` alias to your `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    plugins: [
        // ...
    ],
    resolve: {
        alias: {
            '@form-builder': path.resolve(
                __dirname,
                'vendor/tranquil-tools/laravel-vue-form-builder/resources/js'
            ),
        },
    },
});
```

## 5. Add the Tailwind CSS source

Add an `@source` directive to `resources/css/app.css` so Tailwind scans the package's Vue components:

```css
@source '../../vendor/tranquil-tools/laravel-vue-form-builder/resources/js/**/*.vue';
```

## 6. Build assets

```bash
npm run build
```

## 7. Publish config (optional)

To customize WYSIWYG or reCAPTCHA settings, publish the config file:

```bash
php artisan vendor:publish --tag="vue-form-builder-config"
```

This creates `config/vue-form-builder.php`. See [Configuration](configuration) for all options.
