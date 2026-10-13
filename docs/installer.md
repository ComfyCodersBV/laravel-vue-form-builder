# Installer Support

A package that ships Vue files needs a Vite alias in the application, and usually a `paths` entry in `tsconfig.json`
for its types. The `InstallsFrontendAliases` trait adds both from your own install command, so every package patches
those files the same way. The CrudBuilder's `crud-builder:install` uses it too.

```php
use Illuminate\Console\Command;
use TranquilTools\VueFormBuilder\Support\Installer\InstallsFrontendAliases;

class InstallCommand extends Command
{
    use InstallsFrontendAliases;

    protected $signature = 'mailbox:install';

    public function handle(): int
    {
        $this->installAliases([
            '@mailbox' => './vendor/j87/laravel-vue-mailbox/resources/js',
        ]);

        $this->installTsPaths([
            '@mailbox/*' => './vendor/j87/laravel-vue-mailbox/resources/js/*',
        ]);

        return self::SUCCESS;
    }
}
```

## `installAliases()`

Finds `vite.config.ts`, `.js`, `.mjs` or `.mts` in the application root and adds the aliases that are missing:

- into an existing `resolve.alias` block, or as a new `resolve` block at the top of `defineConfig({`
- a target starting with `./` becomes `fileURLToPath(new URL('./…', import.meta.url))`, and `fileURLToPath` is imported
  from `node:url` (added to an existing `url`/`node:url` import when there is one); other targets stay a plain string
- an alias that is already present, quoted either way, is left alone, so running the command twice changes nothing

It returns `false` and warns when there is no vite config, or when it finds no `resolve.alias` block to extend and
cannot add a `resolve` block (a config with `resolve` but without `alias`, or without `defineConfig({`). The file is then not touched; ask the user to add the alias by hand.

## `installTsPaths()`

Adds the missing entries to `compilerOptions.paths` in `tsconfig.json`, or creates the `paths` block. Comments are
allowed in the file and kept. A path counts as present when its key, or a wildcard on its first segment
(`@mailbox/*` for `@mailbox/types/*`), is already there. Without a `tsconfig.json` it does nothing and returns `false`.

## Hooks

| Method | Default | Purpose |
|---|---|---|
| `inspectViteConfig(string $content, string $file)` | nothing | check the vite config before it is patched, e.g. warn about an outdated alias |
| `tsPathsDescription()` | `'paths'` | the noun in "tsconfig.json already has the paths." |
| `viteConfigPath()` | the first vite config found | point at another file |

## Other building blocks

- `ViteConfigPatcher` and `TsConfigPatcher` (same namespace) work on strings and write nothing, for an installer that
  wants its own messages.
- The `DetectsPagesDirectory` trait gives `detectPagesDir()`: `pages` or `Pages` under `resources/js`, read from the
  directory or from the Inertia root view, for publishing pages to the right place.
