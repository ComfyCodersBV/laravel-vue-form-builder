<?php

declare(strict_types=1);

namespace TranquilTools\FormBuilder\Fields;

use TranquilTools\FormBuilder\Fields\Traits\HasValue;

class Checkbox extends BaseField
{
    use HasValue;

    protected string $type = 'checkbox';

    public function __construct()
    {
        if (! array_key_exists('value', $this->attributes)) {
            $this->value('1');
        }

        if (! array_key_exists('falseValue', $this->attributes)) {
            $this->falseValue('0');
        }
    }

    public function checked(bool $checked = true): static
    {
        if ($checked) {
            $this->default(true);
        }

        return $this;
    }
}
