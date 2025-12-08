<?php

declare(strict_types=1);

namespace TranquilTools\FormBuilder\Fields;

class DateTime extends Date
{
    protected string $type = 'date';

    public function __construct()
    {
        $this->enableTime();
    }
}
