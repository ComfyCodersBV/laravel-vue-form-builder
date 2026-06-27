<?php

declare(strict_types=1);

namespace TranquilTools\FormBuilder\Fields;

class DeleteButton extends Button
{
    protected string $type = 'delete';

    public function toSchema(): array
    {
        $this->label ??= trans('vue-form-builder::buttons.delete');
        $this->cancelLabel ??= trans('vue-form-builder::buttons.cancel');
        $this->confirmTitle ??= trans('vue-form-builder::buttons.confirm-title');
        $this->confirmMessage ??= trans('vue-form-builder::buttons.confirm-message');

        return parent::toSchema();
    }
}
