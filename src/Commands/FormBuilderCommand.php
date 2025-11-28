<?php

namespace TranquilTools\FormBuilder\Commands;

use Illuminate\Console\Command;

class FormBuilderCommand extends Command
{
    public $signature = 'laravel-vue-form-builder';

    public $description = 'My command';

    public function handle(): int
    {
        $this->comment('All done');

        return self::SUCCESS;
    }
}
