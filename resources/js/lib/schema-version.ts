/**
 * The schema contract this renderer implements.
 *
 * The PHP core emits `schemaVersion` in every payload (FormConfig::SCHEMA_VERSION).
 * A major mismatch means the core describes forms in a way this renderer does not
 * understand — fields from the newer contract would render as nothing at all. That
 * must never pass silently, so it throws during development and warns in production,
 * where a degraded form still beats a blank page.
 *
 * A payload without the field comes from a core older than the versioning itself.
 * That schema is by definition the shape this renderer already handles, so it is a
 * development-time nudge to upgrade and nothing more.
 */
export const SUPPORTED_SCHEMA_VERSION = '1.0';

const majorOf = (version: string): string => version.split('.')[0];

export function assertSupportedSchemaVersion(schemaVersion?: string): void {
    if (typeof schemaVersion === 'undefined') {
        if (import.meta.env.DEV) {
            console.warn(
                `[form-builder] This form schema carries no schemaVersion, so it predates the ${SUPPORTED_SCHEMA_VERSION} contract. It renders fine today. Upgrade tranquil-tools/laravel-form-builder to ^1.0 to keep the check meaningful.`,
            );
        }

        return;
    }

    if (majorOf(schemaVersion) === majorOf(SUPPORTED_SCHEMA_VERSION)) {
        return;
    }

    const message = `[form-builder] Schema version mismatch: the core emitted ${schemaVersion}, this renderer supports ${SUPPORTED_SCHEMA_VERSION}. Fields introduced by the other contract render as nothing. Align tranquil-tools/laravel-form-builder and tranquil-tools/laravel-vue-form-builder.`;

    if (import.meta.env.DEV) {
        throw new Error(message);
    }

    console.warn(message);
}
