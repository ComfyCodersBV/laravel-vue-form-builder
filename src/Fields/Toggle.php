<?php

declare(strict_types=1);

namespace TranquilTools\FormBuilder\Fields;

use TranquilTools\FormBuilder\Fields\Traits\HasValue;

class Toggle extends BaseField
{
    use HasValue;

    protected string $type = 'toggle';

    public function __construct()
    {
        if (! array_key_exists('value', $this->attributes)) {
            $this->value('1');
        }

        if (! array_key_exists('falseValue', $this->attributes)) {
            $this->falseValue('0');
        }
    }

    public function on(bool $on = true): static
    {
        if ($on) {
            $this->default(true);
        }

        return $this;
    }
}
