import { profileFeatures } from './profiles'
import type { WysiwygFeature } from './profiles'

const BUTTONS: Array<Partial<Record<WysiwygFeature, string[]>>> = [
    {
        bold: ['bold'],
        italic: ['italic'],
        underline: ['underline'],
        strike: ['strikethrough'],
    },
    {
        color: ['brush'],
    },
    {
        list: ['ul', 'ol'],
        indent: ['outdent', 'indent'],
        align: ['align'],
    },
    {
        link: ['link'],
        image: ['image'],
    },
    {
        clean: ['eraser'],
        undo: ['undo', 'redo'],
        source: ['source'],
    },
]

const BLOCKS: Partial<Record<WysiwygFeature, Record<string, string>>> = {
    heading: {
        h1: 'Heading 1',
        h2: 'Heading 2',
        h3: 'Heading 3',
    },
    blockquote: {
        blockquote: 'Quote',
    },
    'code-block': {
        pre: 'Code',
    },
}

export const JODIT_PROFILE_FEATURES: WysiwygFeature[] = [
    ...new Set([
        ...BUTTONS.flatMap((group) => Object.keys(group) as WysiwygFeature[]),
        ...(Object.keys(BLOCKS) as WysiwygFeature[]),
    ]),
]

export function joditProfileConfig(features: readonly string[]): Record<string, unknown> {
    const enabled = profileFeatures(features)

    const blocks = enabled.reduce<Record<string, string>>((list, feature) => ({ ...list, ...(BLOCKS[feature] ?? {}) }), {})

    const groups = BUTTONS
        .map((group) => enabled.flatMap((feature) => group[feature] ?? []))
        .filter((group) => group.length > 0)

    const buttons = [
        ...(Object.keys(blocks).length > 0 ? [['paragraph']] : []),
        ...groups,
    ].flatMap((group, index) => (index === 0 ? group : ['|', ...group]))

    return {
        buttons,
        toolbarAdaptive: false,
        showCharsCounter: false,
        showWordsCounter: false,
        showXPathInStatusbar: false,
        controls: {
            paragraph: {
                list: {
                    p: 'Paragraph',
                    ...blocks,
                },
            },
        },
    }
}
