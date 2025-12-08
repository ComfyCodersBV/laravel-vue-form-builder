<?php

namespace TranquilTools\FormBuilder\Fields\Traits;

trait HasTextfieldOptions
{
    public function prepend(string $text): static
    {
        $this->attributes['prepend'] = $text;

        return $this;
    }

    public function append(string $text): static
    {
        $this->attributes['append'] = $text;

        return $this;
    }

    public function tooltip(string|array $content): static
    {
        $this->attributes['tooltip'] = $content;

        return $this;
    }

    public function autocomplete(bool|string $autocomplete = true): static
    {
        if (is_bool($autocomplete)) {
            $autocomplete = $autocomplete ? 'on' : 'off';
        }

        $this->attributes['autocomplete'] = $autocomplete;

        return $this;
    }
}
