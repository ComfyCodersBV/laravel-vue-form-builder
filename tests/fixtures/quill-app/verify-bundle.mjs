import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * The inverse assertion of the bare-app fixture: here the engine is installed
 * and the adapter is registered, so it must be present.
 *
 * Without this, the bare-app fixture could pass for the wrong reason — a moved,
 * renamed or broken adapter also produces a bundle without an engine in it.
 */
const ENGINE_MARKERS = [
    'ql-editor',
    'ql-toolbar',
];

const assetsDir = path.resolve(import.meta.dirname, 'dist/assets');

const bundles = readdirSync(assetsDir)
    .filter((file) => file.endsWith('.js') || file.endsWith('.css'))
    .map((file) => readFileSync(path.join(assetsDir, file), 'utf8'));

if (bundles.length === 0) {
    console.error('No build output found. Run the build before verifying.');
    process.exit(1);
}

const missing = ENGINE_MARKERS.filter(
    (marker) => ! bundles.some((contents) => contents.includes(marker)),
);

if (missing.length > 0) {
    console.error('The registered Quill adapter did not reach the bundle.');
    missing.forEach((marker) => console.error(`  - no asset contains "${marker}"`));
    console.error('\nThe documented registration snippet no longer works.');
    process.exit(1);
}

console.log('The registered Quill adapter is present in the bundle.');
