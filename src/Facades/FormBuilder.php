<?php

namespace TranquilTools\FormBuilder\Facades;

use Illuminate\Support\Facades\Facade;

/**
 * @see \TranquilTools\FormBuilder\FormBuilder
 */
class FormBuilder extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return \TranquilTools\FormBuilder\FormBuilder::class;
    }
}
