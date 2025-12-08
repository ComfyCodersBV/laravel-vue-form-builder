<?php

declare(strict_types=1);

namespace TranquilTools\FormBuilder\Fields;

use TranquilTools\FormBuilder\Fields\Traits\HasInline;
use TranquilTools\FormBuilder\Fields\Traits\HasOptions;
use TranquilTools\FormBuilder\Fields\Traits\HasValue;

class Radio extends BaseField
{
    use HasInline;
    use HasOptions;
    use HasValue;

    protected string $type = 'radio';
}
