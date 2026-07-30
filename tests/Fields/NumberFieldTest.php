<?php

declare(strict_types=1);

use TranquilTools\FormBuilder\Fields\Number;

it('renders the number type', function () {
    expect(Number::make('age')->toSchema()['type'])->toBe('number');
});

it('adds a min attribute and rule via minValue', function () {
    $schema = Number::make('age')->minValue(18)->toSchema();

    expect($schema['min'])->toBe(18)
        ->and($schema['rules'])->toBe(['min:18']);
});

it('adds a max attribute and rule via maxValue', function () {
    $schema = Number::make('age')->maxValue(99)->toSchema();

    expect($schema['max'])->toBe(99)
        ->and($schema['rules'])->toBe(['max:99']);
});

it('stores a step attribute', function () {
    expect(Number::make('price')->step(0.01)->toSchema()['step'])->toBe(0.01);
});

it('constrains to positive numbers via unsigned', function () {
    $schema = Number::make('quantity')->unsigned()->toSchema();

    expect($schema['min'])->toBe(0)
        ->and($schema['rules'])->toBe(['min:0']);
});

it('adds a stepper attribute', function () {
    expect(Number::make('quantity')->stepper()->toSchema()['stepper'])->toBeTrue();
});

it('defaults stepper button labels to translated text', function () {
    $schema = Number::make('quantity')->toSchema();

    expect($schema['decrementLabel'])->toBe('Decrease')
        ->and($schema['incrementLabel'])->toBe('Increase');
});

it('keeps explicit stepper label overrides', function () {
    $schema = Number::make('quantity')
        ->attributes([
            'decrementLabel' => 'Minder',
            'incrementLabel' => 'Meer',
        ])
        ->toSchema();

    expect($schema['decrementLabel'])->toBe('Minder')
        ->and($schema['incrementLabel'])->toBe('Meer');
});
