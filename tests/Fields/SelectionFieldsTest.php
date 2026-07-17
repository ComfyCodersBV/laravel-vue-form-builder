<?php

declare(strict_types=1);

use Illuminate\Support\Collection;
use TranquilTools\FormBuilder\Fields\Checkbox;
use TranquilTools\FormBuilder\Fields\Checkboxes;
use TranquilTools\FormBuilder\Fields\Radio;
use TranquilTools\FormBuilder\Fields\Radios;
use TranquilTools\FormBuilder\Fields\Select;
use TranquilTools\FormBuilder\Fields\Toggle;

it('gives a checkbox default true and false values', function () {
    $schema = Checkbox::make('active')->toSchema();

    expect($schema['type'])->toBe('checkbox')
        ->and($schema['value'])->toBe('1')
        ->and($schema['falseValue'])->toBe('0');
});

it('sets a checkbox label and pre-checks it', function () {
    $schema = Checkbox::make('active')
        ->checkboxLabel('This account is active')
        ->checked()
        ->toSchema();

    expect($schema['checkboxLabel'])->toBe('This account is active')
        ->and($schema['default'])->toBeTrue();
});

it('overrides checkbox true/false values', function () {
    $schema = Checkbox::make('active')->value(true)->falseValue(false)->toSchema();

    expect($schema['value'])->toBeTrue()
        ->and($schema['falseValue'])->toBeFalse();
});

it('renders checkboxes as buttons or inline', function () {
    expect(Checkboxes::make('perms')->buttons()->toSchema()['buttons'])->toBeTrue()
        ->and(Checkboxes::make('perms')->buttons(false)->toSchema()['buttons'])->toBeFalse()
        ->and(Checkboxes::make('perms')->inline()->toSchema()['inline'])->toBeTrue();
});

it('stores checkbox options', function () {
    $schema = Checkboxes::make('perms')
        ->options(['read' => 'Read', 'write' => 'Write'])
        ->toSchema();

    expect($schema['type'])->toBe('checkboxes')
        ->and($schema['options'])->toBe(['read' => 'Read', 'write' => 'Write']);
});

it('gives a toggle default true and false values', function () {
    $schema = Toggle::make('enabled')->toSchema();

    expect($schema['type'])->toBe('toggle')
        ->and($schema['value'])->toBe('1')
        ->and($schema['falseValue'])->toBe('0');
});

it('turns a toggle on by default', function () {
    expect(Toggle::make('enabled')->on()->toSchema()['default'])->toBe('1')
        ->and(Toggle::make('enabled')->on(false)->toSchema()['default'])->toBeNull();
});

it('supports multiple selection and option mapping on a select', function () {
    $schema = Select::make('user_id')
        ->options(['1' => 'Alice', '2' => 'Bob'])
        ->optionLabel('full_name')
        ->optionValue('uuid')
        ->multiple()
        ->toSchema();

    expect($schema['type'])->toBe('select')
        ->and($schema['multiple'])->toBeTrue()
        ->and($schema['optionLabel'])->toBe('full_name')
        ->and($schema['optionValue'])->toBe('uuid')
        ->and($schema['options'])->toBe(['1' => 'Alice', '2' => 'Bob']);
});

it('accepts a collection of options', function () {
    $schema = Select::make('tags')
        ->options(new Collection(['a' => 'A', 'b' => 'B']))
        ->toSchema();

    expect($schema['options'])->toBe(['a' => 'A', 'b' => 'B']);
});

it('groups individual radio fields into a single radios group', function () {
    $schemas = [
        Radio::make('plan')->value('starter')->label('Starter')->toSchema(),
        Radio::make('plan')->value('pro')->label('Pro')->toSchema(),
    ];

    $normalized = Radio::normalize($schemas);

    expect($normalized)->toHaveCount(1)
        ->and($normalized[0]['type'])->toBe('radios')
        ->and($normalized[0]['name'])->toBe('plan')
        ->and($normalized[0]['options'])->toBe([
            ['value' => 'starter', 'label' => 'Starter'],
            ['value' => 'pro', 'label' => 'Pro'],
        ]);
});

it('carries the inline flag onto the grouped radios', function () {
    $normalized = Radio::normalize([
        Radio::make('plan')->value('starter')->label('Starter')->inline()->toSchema(),
        Radio::make('plan')->value('pro')->label('Pro')->toSchema(),
    ]);

    expect($normalized)->toHaveCount(1)
        ->and($normalized[0]['inline'])->toBeTrue();
});

it('leaves non-radio fields untouched during normalization', function () {
    $schemas = [
        Radios::make('plan')->options(['a' => 'A'])->toSchema(),
    ];

    expect(Radio::normalize($schemas))->toBe($schemas);
});
