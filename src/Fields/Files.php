<?php

declare(strict_types=1);

namespace TranquilTools\FormBuilder\Fields;

class Files extends File
{
    protected string $type = 'file';

    public function __construct()
    {
        $this->multiple();
    }
}
