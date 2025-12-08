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
}
