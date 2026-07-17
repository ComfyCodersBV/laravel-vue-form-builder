<?php

declare(strict_types=1);

use TranquilTools\FormBuilder\Fields\Radio;

it('normalizes assoc options on a radios-typed schema', function () {
    $normalized = Radio::normalize([
        ['type' => 'radios', 'name' => 'plan', 'options' => ['a' => 'A', 'b' => 'B']],
    ]);

    expect($normalized[0]['options'])->toBe([
        ['value' => 'a', 'label' => 'A'],
        ['value' => 'b', 'label' => 'B'],
    ]);
});

it('normalizes a list of object options', function () {
    $normalized = Radio::normalize([
        ['type' => 'radios', 'name' => 'plan', 'options' => [
            ['value' => 1, 'label' => 'One'],
            ['value' => 2],
        ]],
    ]);

    expect($normalized[0]['options'])->toBe([
        ['value' => 1, 'label' => 'One'],
        ['value' => 2, 'label' => '2'],
    ]);
});

it('normalizes scalar options', function () {
    $normalized = Radio::normalize([
        ['type' => 'radios', 'name' => 'plan', 'options' => ['x', 5]],
    ]);

    expect($normalized[0]['options'])->toBe([
        ['value' => 'x', 'label' => 'x'],
        ['value' => 5, 'label' => '5'],
    ]);
});

it('carries per-option help and disabled flags from individual radios', function () {
    $normalized = Radio::normalize([
        Radio::make('plan')->value('a')->label('A')->help('hint')->toSchema(),
        Radio::make('plan')->value('b')->label('B')->disabled()->toSchema(),
    ]);

    expect($normalized[0]['options'])->toBe([
        ['value' => 'a', 'label' => 'A', 'help' => 'hint'],
        ['value' => 'b', 'label' => 'B', 'disabled' => true],
    ]);
});

it('preserves surrounding fields and their order', function () {
    $normalized = Radio::normalize([
        ['type' => 'text', 'name' => 'before'],
        Radio::make('plan')->value('a')->label('A')->toSchema(),
        Radio::make('plan')->value('b')->label('B')->toSchema(),
        ['type' => 'text', 'name' => 'after'],
    ]);

    expect($normalized)->toHaveCount(3)
        ->and($normalized[0]['name'])->toBe('before')
        ->and($normalized[1]['type'])->toBe('radios')
        ->and($normalized[1]['name'])->toBe('plan')
        ->and($normalized[1]['options'])->toHaveCount(2)
        ->and($normalized[2]['name'])->toBe('after');
});

it('places the grouped radios at the position of the first radio', function () {
    $normalized = Radio::normalize([
        Radio::make('plan')->value('a')->label('A')->toSchema(),
        ['type' => 'text', 'name' => 'middle'],
        Radio::make('plan')->value('b')->label('B')->toSchema(),
    ]);

    expect($normalized)->toHaveCount(2)
        ->and($normalized[0]['type'])->toBe('radios')
        ->and($normalized[0]['options'])->toHaveCount(2)
        ->and($normalized[1]['name'])->toBe('middle');
});
