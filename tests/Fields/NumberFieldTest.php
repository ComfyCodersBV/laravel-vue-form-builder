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
