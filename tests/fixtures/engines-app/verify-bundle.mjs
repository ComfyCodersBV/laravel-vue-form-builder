import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Same assertion as the quill-app fixture, for the two adapters that have no
 * fixture of their own. Each marker is a string the engine itself emits, not
 * something our adapter writes, so a marker can only be present if the engine
 * really made it into the bundle.
 */
const ENGINE_MARKERS = {
    HugeRTE: ['hugerte', 'tox-toolbar'],
    Jodit: ['jodit-wysiwyg', 'jodit_theme_default'],
};

const assetsDir = path.resolve(import.meta.dirname, 'dist/assets');

const bundles = readdirSync(assetsDir)
    .filter((file) => file.endsWith('.js') || file.endsWith('.css'))
    .map((file) => readFileSync(path.join(assetsDir, file), 'utf8'));

if (bundles.length === 0) {
    console.error('No build output found. Run the build before verifying.');
    process.exit(1);
}

let failed = false;

for (const [engine, markers] of Object.entries(ENGINE_MARKERS)) {
    const missing = markers.filter(
        (marker) => ! bundles.some((contents) => contents.includes(marker)),
    );

    if (missing.length === 0) {
        continue;
    }

    failed = true;
    console.error(`The registered ${engine} adapter did not reach the bundle.`);
    missing.forEach((marker) => console.error(`  - no asset contains "${marker}"`));
}

if (failed) {
    console.error('\nThe documented registration snippet no longer works.');
    process.exit(1);
}

console.log('The registered HugeRTE and Jodit adapters are present in the bundle.');
