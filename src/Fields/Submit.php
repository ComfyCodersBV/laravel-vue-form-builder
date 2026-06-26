<?php

declare(strict_types=1);

namespace TranquilTools\FormBuilder\Fields;

class Submit extends Button
{
    protected string $type = 'submit';

    protected ?string $label = 'Save';
}