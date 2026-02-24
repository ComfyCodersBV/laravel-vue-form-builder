<?php

declare(strict_types=1);

namespace TranquilTools\FormBuilder;

use Illuminate\Support\Facades\Validator;
use Spatie\LaravelPackageTools\Package;
use Spatie\LaravelPackageTools\PackageServiceProvider;
use TranquilTools\FormBuilder\Commands\FormMakeCommand;
use TranquilTools\FormBuilder\Commands\FormRequestMakeCommand;
use TranquilTools\FormBuilder\Rules\RecaptchaRule;

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

    public function packageBooted(): void
    {
        Validator::extend('recaptcha', function ($attribute, $value, $parameters) {
            $action = $parameters[0] ?? null;
            $minScore = isset($parameters[1]) ? (float) $parameters[1] : null;

            $rule = new RecaptchaRule($action, $minScore);
            $passes = true;

            $rule->validate($attribute, $value, function ($message) use (&$passes) {
                $passes = false;
            });

            return $passes;
        }, trans('vue-form-builder::recaptcha.validation-failed'));
    }
}
