<?php

declare(strict_types=1);

use TranquilTools\FormBuilder\Fields\File;
use TranquilTools\FormBuilder\Fields\Files;

it('renders the file type', function () {
    expect(File::make('avatar')->toSchema()['type'])->toBe('file');
});

it('sets the accept attribute and a mimetypes rule', function () {
    $schema = File::make('doc')->accept('application/pdf', 'image/png')->toSchema();

    expect($schema['accept'])->toBe(['application/pdf', 'image/png'])
        ->and($schema['rules'])->toBe(['mimetypes:application/pdf,image/png']);
});

it('accepts mimetypes passed as an array', function () {
    $schema = File::make('doc')->accept(['image/jpeg', 'image/png'])->toSchema();

    expect($schema['accept'])->toBe(['image/jpeg', 'image/png'])
        ->and($schema['rules'])->toBe(['mimetypes:image/jpeg,image/png']);
});

it('flags multiple selection', function () {
    expect(File::make('photos')->multiple()->toSchema()['multiple'])->toBeTrue();
});

it('Files is a multiple file field', function () {
    $schema = Files::make('attachments')->toSchema();

    expect($schema['type'])->toBe('file')
        ->and($schema['multiple'])->toBeTrue();
});
