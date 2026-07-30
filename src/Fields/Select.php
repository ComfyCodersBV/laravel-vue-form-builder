<?php

declare(strict_types=1);

namespace TranquilTools\FormBuilder\Fields;

use TranquilTools\FormBuilder\Fields\Traits\HasMultiple;
use TranquilTools\FormBuilder\Fields\Traits\HasOptions;

class Select extends BaseField
{
    use HasMultiple;
    use HasOptions;

    protected string $type = 'select';

    public function toSchema(): array
    {
        $this->attributes['searchPlaceholder'] ??= trans('vue-form-builder::fields.search-placeholder');
        $this->attributes['noResultsLabel'] ??= trans('vue-form-builder::fields.no-results');
        $this->attributes['choosePlaceholder'] ??= trans('vue-form-builder::fields.choose-option');

        return parent::toSchema();
    }
}
