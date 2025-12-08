<?php

namespace TranquilTools\FormBuilder\Fields\Traits;

trait HasValue
{
    public function value(string|int|bool $value): static
    {
        $this->attributes['value'] = $value;

        return $this;
    }

    public function falseValue(string|int|bool $value): static
    {
        $this->attributes['falseValue'] = $value;

        return $this;
    }
}
