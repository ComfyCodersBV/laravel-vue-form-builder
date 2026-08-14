import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

/**
 * The Pest counterpart of this guard lived in tests/Wysiwyg until the PHP core
 * moved to tranquil-tools/laravel-form-builder. This package ships no PHP, so
 * the guard runs on Node instead. Behaviour is unchanged.
 */

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const sourceRoot = join(packageRoot, 'resources/js');

const javascriptSources = (directory = sourceRoot) =>
    readdirSync(directory).flatMap((entry) => {
        const path = join(directory, entry);

        if (statSync(path).isDirectory()) {
            return javascriptSources(path);
        }

        return [path];
    });

const sources = javascriptSources().map((path) => ({
    path,
    name: relative(sourceRoot, path),
    contents: readFileSync(path, 'utf8'),
}));

const adapters = {
    QuillEditor: ['vue-quilly', "from 'quill'", 'quill-image-resize-module'],
    HugeRteEditor: ['hugerte'],
    JoditEditor: ["from 'jodit'", "'jodit/"],
};

test('does not reference editor dependencies outside their own adapter', () => {
    for (const [component, specifiers] of Object.entries(adapters)) {
        const outsiders = sources.filter((source) => !source.name.includes(component));

        for (const source of outsiders) {
            for (const specifier of specifiers) {
                assert.ok(
                    !source.contents.includes(specifier),
                    `${source.name} must not reference ${specifier}`,
                );
            }
        }
    }
});

test('never discovers editors through import.meta.glob', () => {
    const wysiwygSources = sources.filter((source) => source.name.startsWith('wysiwyg'));

    assert.notEqual(wysiwygSources.length, 0, 'expected to find sources under resources/js/wysiwyg');

    for (const source of wysiwygSources) {
        assert.ok(
            !source.contents.includes('import.meta.glob'),
            `${source.name} must not use import.meta.glob`,
        );
    }
});

test('drops the unmaintained quill image resize module entirely', () => {
    for (const source of sources) {
        assert.ok(
            !source.contents.includes('quill-image-resize'),
            `${source.name} must not reference quill-image-resize`,
        );
    }
});
