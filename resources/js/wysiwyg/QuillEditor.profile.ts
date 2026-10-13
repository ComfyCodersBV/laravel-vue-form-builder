import { profileFeatures } from './profiles'
import type { WysiwygFeature } from './profiles'

type ToolbarGroup = Array<string | Record<string, unknown>>

const TOOLBAR_GROUPS: Array<Partial<Record<WysiwygFeature, ToolbarGroup>>> = [
    {
        heading: [{ header: [1, 2, 3, false] }],
    },
    {
        bold: ['bold'],
        italic: ['italic'],
        underline: ['underline'],
        strike: ['strike'],
    },
    {
        color: [{ color: [] }, { background: [] }],
    },
    {
        link: ['link'],
        blockquote: ['blockquote'],
        'code-block': ['code-block'],
        image: ['image'],
    },
    {
        list: [{ list: 'ordered' }, { list: 'bullet' }],
        indent: [{ indent: '-1' }, { indent: '+1' }],
        align: [{ align: [] }],
    },
    {
        clean: ['clean'],
    },
]

const FORMATS: Partial<Record<WysiwygFeature, string[]>> = {
    bold: ['bold'],
    italic: ['italic'],
    underline: ['underline'],
    strike: ['strike'],
    link: ['link'],
    list: ['list'],
    blockquote: ['blockquote'],
    heading: ['header'],
    'code-block': ['code-block'],
    align: ['align'],
    indent: ['indent'],
    color: ['color', 'background'],
    image: ['image'],
}

export const QUILL_PROFILE_FEATURES: WysiwygFeature[] = [
    ...new Set(TOOLBAR_GROUPS.flatMap((group) => Object.keys(group) as WysiwygFeature[])),
    'source',
]

export function quillProfileConfig(features: readonly string[]): Record<string, unknown> {
    const enabled = profileFeatures(features)

    const toolbar = TOOLBAR_GROUPS
        .map((group) => enabled.flatMap((feature) => group[feature] ?? []))
        .filter((group) => group.length > 0)

    return {
        theme: 'snow',
        showSourceButton: enabled.includes('source'),
        formats: enabled.flatMap((feature) => FORMATS[feature] ?? []),
        modules: {
            toolbar,
        },
    }
}
