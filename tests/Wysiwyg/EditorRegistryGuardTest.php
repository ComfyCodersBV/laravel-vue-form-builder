<?php

declare(strict_types=1);

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\File;

function javascriptSources(): Collection
{
    return collect(File::allFiles(__DIR__.'/../../resources/js'));
}

it('does not reference editor dependencies outside their own adapter', function () {
    $adapters = [
        'QuillEditor' => [
            'vue-quilly',
            "from 'quill'",
            'quill-image-resize-module',
        ],
    ];

    foreach ($adapters as $component => $specifiers) {
        $sources = javascriptSources()
            ->reject(fn ($file) => str_contains($file->getFilename(), $component));

        foreach ($sources as $file) {
            foreach ($specifiers as $specifier) {
                expect(File::get($file->getPathname()))
                    ->not->toContain($specifier, "{$file->getRelativePathname()} must not reference {$specifier}");
            }
        }
    }
});

it('never discovers editors through import.meta.glob', function () {
    $sources = javascriptSources()
        ->filter(fn ($file) => str_starts_with($file->getRelativePathname(), 'wysiwyg'));

    expect($sources)->not->toBeEmpty();

    foreach ($sources as $file) {
        expect(File::get($file->getPathname()))
            ->not->toContain('import.meta.glob', "{$file->getRelativePathname()} must not use import.meta.glob");
    }
});

it('drops the unmaintained quill image resize module entirely', function () {
    foreach (javascriptSources() as $file) {
        expect(File::get($file->getPathname()))->not->toContain('quill-image-resize');
    }
});
