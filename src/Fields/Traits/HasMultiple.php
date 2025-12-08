<?php

namespace TranquilTools\FormBuilder\Fields\Traits;

trait HasMultiple
{
    public function multiple(bool $multiple = true): static
    {
        if ($multiple) {
            $this->attributes['multiple'] = true;
        }

        return $this;
    }
}
