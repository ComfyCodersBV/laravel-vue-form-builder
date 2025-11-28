<?php

namespace TranquilTools\FormBuilder;

use Spatie\LaravelPackageTools\Package;
use Spatie\LaravelPackageTools\PackageServiceProvider;
use TranquilTools\FormBuilder\Commands\FormBuilderCommand;

class FormBuilderServiceProvider extends PackageServiceProvider
{
    public function configurePackage(Package $package): void
    {
        /*
         * This class is a Package Service Provider
         *
         * More info: https://github.com/spatie/laravel-package-tools
         */
        $package
            ->name('laravel-vue-form-builder')
            ->hasConfigFile()
            ->hasViews()
            ->hasMigration('create_laravel_vue_form_builder_table')
            ->hasCommand(FormBuilderCommand::class);
    }
}
