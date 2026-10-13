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
