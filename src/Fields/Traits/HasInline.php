<?php

namespace TranquilTools\FormBuilder\Fields\Traits;

trait HasInline
{
    public function inline(bool $inline = true): static
    {
        $this->attributes['inline'] = $inline;

        return $this;
    }
}
