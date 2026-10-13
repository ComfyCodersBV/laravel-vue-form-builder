<?php

declare(strict_types=1);

namespace TranquilTools\VueFormBuilder\Support\Installer;

trait InstallsFrontendAliases
{
    /**
     * @param  array<string, string>  $aliases
     */
    protected function installAliases(array $aliases): bool
    {
        $path = $this->viteConfigPath();

        if (is_null($path)) {
            $this->components->warn('No vite config (vite.config.ts|js|mjs|mts) found - skipping Vite alias setup.');

            return false;
        }

        $content = (string) file_get_contents($path);
        $file = basename($path);
        $vite = app(ViteConfigPatcher::class);

        $this->inspectViteConfig($content, $file);

        $missing = array_filter(
            $aliases,
            fn (string $alias): bool => ! $vite->hasAlias($content, $alias),
            ARRAY_FILTER_USE_KEY,
        );

        if ($missing === []) {
            $this->components->info("{$file} already has the Vite aliases.");

            return true;
        }

        $updated = $vite->addAliases($content, $missing);

        if (is_null($updated)) {
            $this->components->warn("Could not auto-inject Vite aliases into {$file}. Add them manually (see docs).");

            return false;
        }

        file_put_contents($path, $updated);

        $this->components->info(sprintf('Vite aliases added to %s: %s.', $file, implode(', ', array_keys($missing))));

        return true;
    }

    /**
     * @param  array<string, string>  $paths
     */
    protected function installTsPaths(array $paths): bool
    {
        $path = base_path('tsconfig.json');

        if (! file_exists($path)) {
            return false;
        }

        $tsConfig = app(TsConfigPatcher::class);
        $content = (string) file_get_contents($path);
        $missing = $tsConfig->missingPaths($content, $paths);
        $description = $this->tsPathsDescription();

        if ($missing === []) {
            $this->components->info("tsconfig.json already has the {$description}.");

            return true;
        }

        $updated = $tsConfig->addPaths($content, $missing);

        if (is_null($updated)) {
            $this->components->warn("Could not add the {$description} to tsconfig.json. Add them manually (see docs).");

            return false;
        }

        file_put_contents($path, $updated);

        $this->components->info('tsconfig.json paths added: '.implode(', ', array_keys($missing)).'.');

        return true;
    }

    protected function inspectViteConfig(string $content, string $file): void {}

    protected function tsPathsDescription(): string
    {
        return 'paths';
    }

    protected function viteConfigPath(): ?string
    {
        foreach (['vite.config.ts', 'vite.config.js', 'vite.config.mjs', 'vite.config.mts'] as $candidate) {
            if (file_exists(base_path($candidate))) {
                return base_path($candidate);
            }
        }

        return null;
    }
}
