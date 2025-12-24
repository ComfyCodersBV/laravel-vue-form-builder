<?php

declare(strict_types=1);

namespace TranquilTools\FormBuilder\Fields\Traits;

use Illuminate\Support\Collection;

trait HasOptions
{
    public function options(Collection|array $options): static
    {
        $this->attributes['options'] = $options instanceof Collection ? $options->toArray() : $options;

        return $this;
    }

    public function optionLabel(string $column = 'name'): static
    {
        $this->attributes['optionLabel'] = $column;

        return $this;
    }

    public function optionValue(string $column = 'id'): static
    {
        $this->attributes['optionValue'] = $column;

        return $this;
    }
}
