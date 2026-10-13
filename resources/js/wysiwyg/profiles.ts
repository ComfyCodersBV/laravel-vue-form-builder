export const WYSIWYG_FEATURES = [
    'bold',
    'italic',
    'underline',
    'strike',
    'link',
    'list',
    'blockquote',
    'heading',
    'code-block',
    'align',
    'indent',
    'color',
    'image',
    'clean',
    'undo',
    'source',
] as const

export type WysiwygFeature = typeof WYSIWYG_FEATURES[number]

export function profileFeatures(features: readonly string[] | undefined): WysiwygFeature[] {
    if (!Array.isArray(features)) {
        return []
    }

    return WYSIWYG_FEATURES.filter((feature) => features.includes(feature))
}

export function usesProfile(features: readonly string[] | undefined): boolean {
    return Array.isArray(features)
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype

export function mergeProfileConfig(profileConfig: Record<string, unknown>, config: unknown): Record<string, unknown> {
    if (!isPlainObject(config)) {
        return { ...profileConfig }
    }

    return Object.entries(config).reduce<Record<string, unknown>>((merged, [key, value]) => {
        const current = merged[key]

        merged[key] = isPlainObject(current) && isPlainObject(value) ? mergeProfileConfig(current, value) : value

        return merged
    }, { ...profileConfig })
}
