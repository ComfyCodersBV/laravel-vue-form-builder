<?php

declare(strict_types=1);

namespace TranquilTools\FormBuilder\Fields;

class Date extends BaseField
{
    protected string $type = 'date';

    public function range(bool $range = true): static
    {
        if ($range) {
            $this->attributes['range'] = true;
        } else {
            unset($this->attributes['range']);
        }

        return $this;
    }

    public function enableTime(bool $enable = true): static
    {
        if ($enable) {
            $this->attributes['enableTime'] = true;
        }

        return $this;
    }

    public function minDate(string $date): static
    {
        $this->attributes['minDate'] = $date;

        return $this;
    }

    public function maxDate(string $date): static
    {
        $this->attributes['maxDate'] = $date;

        return $this;
    }

    /**
     * 0 = Sunday (default), 1 = Monday
     */
    public function weekStartsOn(int $dayOfWeek): static
    {
        $this->attributes['weekStartsOn'] = $dayOfWeek === 1 ? 1 : 0;

        return $this;
    }

    public function format(string $format): static
    {
        $this->attributes['format'] = $format;

        return $this;
    }

    public function locale(string $locale): static
    {
        $this->attributes['locale'] = $locale;

        return $this;
    }
}
