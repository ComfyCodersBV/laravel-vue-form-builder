<?php

declare(strict_types=1);

namespace TranquilTools\FormBuilder\Fields;

class DeleteButton extends BaseField
{
    protected string $type = 'delete';

    protected ?string $cancelLabel = null;

    protected ?string $confirmTitle = null;

    protected ?string $confirmMessage = null;

    protected ?string $deleteUrl = null;

    public function cancelLabel(string $title): static
    {
        $this->cancelLabel = $title;

        return $this;
    }

    public function confirmTitle(string $title): static
    {
        $this->confirmTitle = $title;

        return $this;
    }

    public function confirmMessage(string $message): static
    {
        $this->confirmMessage = $message;

        return $this;
    }

    public function deleteUrl(string $url): static
    {
        $this->deleteUrl = $url;

        return $this;
    }

    public function toSchema(): array
    {
        $schema = parent::toSchema();

        return array_merge($schema, [
            'cancelLabel' => $this->cancelLabel,
            'confirmTitle' => $this->confirmTitle,
            'confirmMessage' => $this->confirmMessage,
            'deleteUrl' => $this->deleteUrl,
        ]);
    }
}
