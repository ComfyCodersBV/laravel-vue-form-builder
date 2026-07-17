<?php

declare(strict_types=1);

use TranquilTools\FormBuilder\Fields\KeyValue;

it('renders the keyvalue type with an array rule', function () {
    $schema = KeyValue::make('meta')->toSchema();

    expect($schema['type'])->toBe('keyvalue')
        ->and($schema['rules'])->toBe(['array']);
});

it('applies the masked key pattern from config by default', function () {
    expect(KeyValue::make('meta')->toSchema()['maskedKeyPattern'])->toBe('password|secret|token');
});

it('overrides the masked key pattern', function () {
    expect(KeyValue::make('meta')->maskedKeyPattern('apikey|token')->toSchema()['maskedKeyPattern'])
        ->toBe('apikey|token');
});

it('stores labels and placeholders', function () {
    $schema = KeyValue::make('meta')
        ->keyLabel('Key')
        ->valueLabel('Value')
        ->keyPlaceholder('name')
        ->valuePlaceholder('value')
        ->maskedValuePlaceholder('••••')
        ->addActionLabel('Add row')
        ->toSchema();

    expect($schema['keyLabel'])->toBe('Key')
        ->and($schema['valueLabel'])->toBe('Value')
        ->and($schema['keyPlaceholder'])->toBe('name')
        ->and($schema['valuePlaceholder'])->toBe('value')
        ->and($schema['maskedValuePlaceholder'])->toBe('••••')
        ->and($schema['addActionLabel'])->toBe('Add row');
});

it('toggles editability, add/delete and reorder behaviour', function () {
    $schema = KeyValue::make('meta')
        ->editableKeys(false)
        ->editableValues()
        ->addable(false)
        ->deletable(false)
        ->reorderable()
        ->readonlyValueKeys(['locked'])
        ->toSchema();

    expect($schema['editableKeys'])->toBeFalse()
        ->and($schema['editableValues'])->toBeTrue()
        ->and($schema['addable'])->toBeFalse()
        ->and($schema['deletable'])->toBeFalse()
        ->and($schema['reorderable'])->toBeTrue()
        ->and($schema['readonlyValueKeys'])->toBe(['locked']);
});
