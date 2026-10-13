<?php

declare(strict_types=1);

namespace TranquilTools\VueFormBuilder\Tests\Fixtures;

use Illuminate\Console\Command;
use TranquilTools\VueFormBuilder\Support\Installer\DetectsPagesDirectory;
use TranquilTools\VueFormBuilder\Support\Installer\InstallsFrontendAliases;

class InstallMailboxCommand extends Command
{
    use DetectsPagesDirectory;
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

        $this->components->info('Pages directory: '.$this->detectPagesDir());

        return self::SUCCESS;
    }
}
