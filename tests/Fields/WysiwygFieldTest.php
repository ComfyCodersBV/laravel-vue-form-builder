<?php

declare(strict_types=1);

use TranquilTools\FormBuilder\Fields\Wysiwyg;

it('renders the wysiwyg type with the default editor from config', function () {
    $schema = Wysiwyg::make('body')->toSchema();

    expect($schema['type'])->toBe('wysiwyg')
        ->and($schema['editor'])->toBe('quill');
});

it('loads editor options from config by default', function () {
    $options = Wysiwyg::make('body')->toSchema()['options'];

    expect($options)->toBeArray()
        ->and($options['theme'])->toBe('snow');
});

it('overrides the editor', function () {
    expect(Wysiwyg::make('body')->editor('trix')->toSchema()['editor'])->toBe('trix');
});

it('overrides the options', function () {
    $schema = Wysiwyg::make('body')->options(['theme' => 'bubble'])->toSchema();

    expect($schema['options'])->toBe(['theme' => 'bubble']);
});
