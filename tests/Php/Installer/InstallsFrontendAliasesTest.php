<?php

declare(strict_types=1);

use Illuminate\Support\Facades\File;

beforeEach(function () {
    $this->sandbox = sys_get_temp_dir().'/vue-form-builder-install-'.uniqid();

    File::ensureDirectoryExists($this->sandbox.'/resources/js');

    $this->app->setBasePath($this->sandbox);
});

afterEach(function () {
    File::deleteDirectory($this->sandbox);
});

it('adds a third-party alias to the vite config and its path to tsconfig.json', function () {
    file_put_contents($this->sandbox.'/vite.config.ts', <<<'TS'
import { defineConfig } from 'vite';

export default defineConfig({
    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },
});
TS);

    file_put_contents($this->sandbox.'/tsconfig.json', <<<'JSON'
{
    "compilerOptions": {
        // starter kit
        "paths": {
            "@/*": ["./resources/js/*"]
        }
    }
}
JSON);

    $this->artisan('mailbox:install')
        ->expectsOutputToContain('Vite aliases added to vite.config.ts: @mailbox.')
        ->expectsOutputToContain('tsconfig.json paths added: @mailbox/*.')
        ->assertSuccessful();

    expect(file_get_contents($this->sandbox.'/vite.config.ts'))
        ->toContain("import { defineConfig } from 'vite';\nimport { fileURLToPath } from 'node:url';")
        ->toContain(<<<'TS'
        alias: {
            '@mailbox': fileURLToPath(
                new URL(
                    './vendor/j87/laravel-vue-mailbox/resources/js',
                    import.meta.url,
                ),
            ),
            '@': '/resources/js',
TS)
        ->and(file_get_contents($this->sandbox.'/tsconfig.json'))
        ->toContain(<<<'JSON'
            "@/*": ["./resources/js/*"],
            "@mailbox/*": [
                "./vendor/j87/laravel-vue-mailbox/resources/js/*"
            ]
JSON);
});

it('changes nothing on a second run and says the aliases and paths are there', function () {
    file_put_contents($this->sandbox.'/vite.config.js', "import { defineConfig } from 'vite';\n\nexport default defineConfig({\n    plugins: [],\n});\n");
    file_put_contents($this->sandbox.'/tsconfig.json', "{\n    \"compilerOptions\": {}\n}\n");

    $this->artisan('mailbox:install')->assertSuccessful();

    $vite = file_get_contents($this->sandbox.'/vite.config.js');
    $tsConfig = file_get_contents($this->sandbox.'/tsconfig.json');

    $this->artisan('mailbox:install')
        ->expectsOutputToContain('vite.config.js already has the Vite aliases.')
        ->expectsOutputToContain('tsconfig.json already has the paths.')
        ->assertSuccessful();

    expect(file_get_contents($this->sandbox.'/vite.config.js'))->toBe($vite)
        ->and(file_get_contents($this->sandbox.'/tsconfig.json'))->toBe($tsConfig)
        ->and($vite)->toContain("'@mailbox': fileURLToPath(")
        ->and($tsConfig)->toContain('"@mailbox/*"');
});

it('warns and leaves the files alone when it cannot patch them', function () {
    $vite = "export default {\n    plugins: [],\n};\n";
    $tsConfig = "{\n    \"include\": []\n}\n";

    file_put_contents($this->sandbox.'/vite.config.ts', $vite);
    file_put_contents($this->sandbox.'/tsconfig.json', $tsConfig);

    $this->artisan('mailbox:install')
        ->expectsOutputToContain('Could not auto-inject Vite aliases into vite.config.ts. Add them manually (see docs).')
        ->expectsOutputToContain('Could not add the paths to tsconfig.json. Add them manually (see docs).')
        ->assertSuccessful();

    expect(file_get_contents($this->sandbox.'/vite.config.ts'))->toBe($vite)
        ->and(file_get_contents($this->sandbox.'/tsconfig.json'))->toBe($tsConfig);
});

it('skips the aliases without a vite config and the paths without a tsconfig', function () {
    $this->artisan('mailbox:install')
        ->expectsOutputToContain('No vite config (vite.config.ts|js|mjs|mts) found - skipping Vite alias setup.')
        ->doesntExpectOutputToContain('tsconfig.json')
        ->assertSuccessful();

    expect(file_exists($this->sandbox.'/tsconfig.json'))->toBeFalse();
});

it('detects the pages directory of the application', function (string $directory) {
    File::deleteDirectory($this->sandbox.'/resources/js');
    File::ensureDirectoryExists($this->sandbox.'/resources/js/'.$directory);

    $this->artisan('mailbox:install')
        ->expectsOutputToContain('Pages directory: '.$directory)
        ->assertSuccessful();
})->with([
    'pages',
    'Pages',
]);
