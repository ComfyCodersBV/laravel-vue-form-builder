<?php

declare(strict_types=1);

namespace TranquilTools\FormBuilder\Facades;

use Illuminate\Support\Facades\Facade;

/**
 * @method static \Illuminate\Support\HtmlString recaptchaJs()
 *
 * @see \TranquilTools\FormBuilder\FormBuilder
 */
class FormBuilder extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return \TranquilTools\FormBuilder\FormBuilder::class;
    }
}
