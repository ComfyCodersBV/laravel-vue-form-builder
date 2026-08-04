import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Asserts that no editor engine ended up in the bundle of an application that
 * never installed one.
 *
 * A successful build is not proof on its own. Node resolution walks upwards out
 * of this fixture, so when the fixture sits inside a larger project that does
 * have quill installed, a reintroduced import resolves happily and the build
 * stays green while the engine is silently bundled. Inspecting the artifact is
 * the only check that holds in both a standalone clone and a nested checkout.
 */
const ENGINE_MARKERS = [
    'ql-editor',
    'ql-toolbar',
    'quilly',
];

const assetsDir = path.resolve(import.meta.dirname, 'dist/assets');

const bundles = readdirSync(assetsDir)
    .filter((file) => file.endsWith('.js') || file.endsWith('.css'))
    .map((file) => ({
        file,
        contents: readFileSync(path.join(assetsDir, file), 'utf8'),
    }));

if (bundles.length === 0) {
    console.error('No build output found. Run the build before verifying.');
    process.exit(1);
}

const leaks = bundles.flatMap(({ file, contents }) =>
    ENGINE_MARKERS
        .filter((marker) => contents.includes(marker))
        .map((marker) => `${file} contains "${marker}"`),
);

if (leaks.length > 0) {
    console.error('An editor engine leaked into the bare application bundle:');
    leaks.forEach((leak) => console.error(`  - ${leak}`));
    console.error('\nSomething inside the package imports an editor adapter again.');
    console.error('Editors must only reach the bundle through registerWysiwygEditor().');
    process.exit(1);
}

console.log(`No editor engine in ${bundles.length} bundled asset(s).`);
