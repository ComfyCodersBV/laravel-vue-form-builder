<?php

namespace TranquilTools\FormBuilder;

use Spatie\LaravelPackageTools\Package;
use Spatie\LaravelPackageTools\PackageServiceProvider;
use TranquilTools\FormBuilder\Commands\FormMakeCommand;
use TranquilTools\FormBuilder\Commands\FormRequestMakeCommand;

class FormBuilderServiceProvider extends PackageServiceProvider
{
    public function configurePackage(Package $package): void
    {
        $package
            ->name('laravel-vue-form-builder')
            ->hasConfigFile()
            ->hasTranslations()
            ->hasCommands([
                FormMakeCommand::class,
                FormRequestMakeCommand::class,
            ]);
    }
}
