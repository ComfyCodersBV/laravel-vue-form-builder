import { profileFeatures } from './profiles'
import type { WysiwygFeature } from './profiles'

const TOOLBAR_GROUPS: Array<Partial<Record<WysiwygFeature, string>>> = [
    {
        undo: 'undo redo',
    },
    {
        heading: 'blocks',
    },
    {
        bold: 'bold',
        italic: 'italic',
        underline: 'underline',
        strike: 'strikethrough',
    },
    {
        color: 'forecolor backcolor',
    },
    {
        link: 'link',
        blockquote: 'blockquote',
        'code-block': 'codesample',
        image: 'image',
    },
    {
        list: 'bullist numlist',
        indent: 'outdent indent',
        align: 'alignleft aligncenter alignright alignjustify',
    },
    {
        clean: 'removeformat',
        source: 'code',
    },
]

export const HUGE_RTE_FEATURE_PLUGINS: Partial<Record<WysiwygFeature, string>> = {
    link: 'link',
    list: 'lists',
    'code-block': 'codesample',
    image: 'image',
    source: 'code',
}

export const HUGE_RTE_PROFILE_FEATURES: WysiwygFeature[] = [
    ...new Set(TOOLBAR_GROUPS.flatMap((group) => Object.keys(group) as WysiwygFeature[])),
]

export function unavailableHugeRteFeatures(features: readonly string[], hasPlugin: (name: string) => boolean): WysiwygFeature[] {
    return profileFeatures(features).filter((feature) => {
        const plugin = HUGE_RTE_FEATURE_PLUGINS[feature]

        return typeof plugin === 'string' && !hasPlugin(plugin)
    })
}

export function hugeRteProfileConfig(features: readonly string[], hasPlugin: (name: string) => boolean): Record<string, unknown> {
    const unavailable = unavailableHugeRteFeatures(features, hasPlugin)
    const enabled = profileFeatures(features).filter((feature) => !unavailable.includes(feature))

    const toolbar = TOOLBAR_GROUPS
        .map((group) => enabled.flatMap((feature) => group[feature] ?? []).join(' '))
        .filter((group) => group !== '')
        .join(' | ')

    return {
        menubar: false,
        statusbar: false,
        toolbar: toolbar === '' ? false : toolbar,
        plugins: enabled.flatMap((feature) => HUGE_RTE_FEATURE_PLUGINS[feature] ?? []),
        block_formats: 'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3',
    }
}
