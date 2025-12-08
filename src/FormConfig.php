<?php

declare(strict_types=1);

namespace TranquilTools\FormBuilder;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use JsonSerializable;
use TranquilTools\FormBuilder\Fields\BaseField;
use TranquilTools\FormBuilder\Fields\Radios;

class FormConfig implements JsonSerializable
{
    protected ?AbstractForm $configurator = null;

    protected array|Model $data = [];

    /** @var BaseField[] */
    protected array $fields = [];

    protected array $options = [];

    protected array|string $class = [];

    protected string $id = '';

    protected string $action = '';

    protected string $method = 'POST';

    public function __construct(array $fields = [])
    {
        $this->fields($fields);
    }

    public static function make(array $fields = []): static
    {
        return new static($fields);
    }

    public function setConfigurator(AbstractForm $configurator): static
    {
        $this->configurator = $configurator;

        return $this;
    }

    public function id(string $id = ''): static
    {
        $this->id = $id;

        return $this;
    }

    public function action(string $action = 'POST'): static
    {
        $this->action = $action;

        return $this;
    }

    public function class(array|string $class): static
    {
        $this->class = $class;

        return $this;
    }

    public function fill($data): static
    {
        $this->data = $data;

        return $this;
    }

    public function fields(array $fields = []): static
    {
        $this->fields = array_merge($this->fields, $fields);

        return $this;
    }

    public function method(string $method = 'POST'): static
    {
        $this->method = $method;

        return $this;
    }

    public function getId(): string
    {
        if ($this->id !== '') {
            return $this->id;
        }

        return Str::snake(class_basename($this->configurator ?? ''));
    }

    public function getAction(): string
    {
        return $this->action;
    }

    public function getClass(): array|string
    {
        return $this->class;
    }

    public function getData(): Model|array
    {
        return $this->data;
    }

    public function getFields(): array
    {
        return $this->fields;
    }

    public function getMethod(): string
    {
        return $this->method;
    }

    public function getOption(string $option): array|bool|string|null
    {
        return $this->options[$option] ?? false;
    }

    public function jsonSerialize(): array
    {
        $schemas = array_map(fn($field) => $field->toSchema(), $this->getFields());
        $schemas = Radios::normalize($schemas);

        return [
            'id' => $this->getId(),
            'action' => $this->getAction(),
            'defaults' => $this->getData(),
            'fields' => $schemas,
            'formClass' => $this->getClass(),
            'method' => $this->getMethod(),
        ];
    }

    public function getRules(): array
    {
        return array_reduce(
            $this->getFields(),
            function (array $carry, BaseField $field): array {
                $name = $field->getName();
                if ($name !== null && $name !== '') {
                    $carry[$name] = $field->getRules();
                }
                return $carry;
            },
            []
        );
    }

    public function validate(?Request $request = null, ...$params): array
    {
        $request = $request ?? request();

        return $request->validate($this->getRules(), ...$params);
    }
}
