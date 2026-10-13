<?php

declare(strict_types=1);

namespace TranquilTools\VueFormBuilder\Tests;

use Illuminate\Contracts\Console\Kernel;
use Orchestra\Testbench\TestCase as Orchestra;
use TranquilTools\VueFormBuilder\Tests\Fixtures\InstallMailboxCommand;

class TestCase extends Orchestra
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->app->make(Kernel::class)->registerCommand(new InstallMailboxCommand);
    }
}
