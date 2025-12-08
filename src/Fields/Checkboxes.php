<?php

declare(strict_types=1);

namespace TranquilTools\FormBuilder\Fields;

use TranquilTools\FormBuilder\Fields\Traits\HasInline;
use TranquilTools\FormBuilder\Fields\Traits\HasOptions;

class Checkboxes extends BaseField
{
    use HasInline;
    use HasOptions;

    protected string $type = 'checkboxes';
}
