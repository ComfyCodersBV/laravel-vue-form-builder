import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import Wysiwyg from '../../resources/js/components/Fields/Wysiwyg.vue'
import { hugeRteProfileConfig } from '../../resources/js/wysiwyg/HugeRteEditor.profile'
import { joditProfileConfig } from '../../resources/js/wysiwyg/JoditEditor.profile'
import { quillProfileConfig } from '../../resources/js/wysiwyg/QuillEditor.profile'
import { mergeProfileConfig } from '../../resources/js/wysiwyg/profiles'
import { registerWysiwygEditor } from '../../resources/js/wysiwyg/registry'

const EMAIL = ['bold', 'italic', 'underline', 'link', 'list', 'blockquote']

describe('wysiwyg profiles', () => {
    it('builds a quill toolbar and format whitelist from the features', () => {
        const config = quillProfileConfig([...EMAIL, 'undo']) as any

        expect(config.modules.toolbar).toEqual([
            ['bold', 'italic', 'underline'],
            ['link', 'blockquote'],
            [{ list: 'ordered' }, { list: 'bullet' }],
        ])
        expect(config.formats).toEqual(['bold', 'italic', 'underline', 'link', 'list', 'blockquote'])
        expect(config.showSourceButton).toBe(false)
    })

    it('builds jodit buttons and puts blockquote in the paragraph list', () => {
        const config = joditProfileConfig(EMAIL) as any

        expect(config.buttons).toEqual(['paragraph', '|', 'bold', 'italic', 'underline', '|', 'ul', 'ol', '|', 'link'])
        expect(config.controls.paragraph.list).toEqual({ p: 'Paragraph', blockquote: 'Quote' })
        expect(config.toolbarAdaptive).toBe(false)
    })

    it('leaves a hugerte feature out when its plugin is not loaded', () => {
        const config = hugeRteProfileConfig(EMAIL, (plugin) => plugin === 'lists') as any

        expect(config.toolbar).toBe('bold italic underline | blockquote | bullist numlist')
        expect(config.plugins).toEqual(['lists'])
        expect(config.menubar).toBe(false)
    })

    it('hands the features to the adapter next to the options', () => {
        let received: Record<string, unknown> = {}

        registerWysiwygEditor('profile-probe', defineComponent({
            props: ['modelValue', 'config', 'features', 'placeholder', 'disabled'],
            setup(props) {
                received = props

                return () => h('div')
            },
        }))

        mount(Wysiwyg, { props: { name: 'body', editor: 'profile-probe', features: EMAIL, options: { theme: 'bubble' } } })

        expect(received.features).toEqual(EMAIL)
        expect(received.config).toEqual({ theme: 'bubble' })
    })

    it('lays options over a profile without dropping the nested profile settings', () => {
        const merged = mergeProfileConfig(quillProfileConfig(EMAIL), {
            modules: { clipboard: { matchVisual: false } },
            formats: ['bold'],
        }) as any

        expect(merged.modules.toolbar).toEqual((quillProfileConfig(EMAIL) as any).modules.toolbar)
        expect(merged.modules.clipboard).toEqual({ matchVisual: false })
        expect(merged.formats).toEqual(['bold'])
        expect(merged.theme).toBe('snow')
    })

    it('replaces arrays and keeps the profile when the options are empty', () => {
        const profile = joditProfileConfig(EMAIL)

        expect((mergeProfileConfig(profile, { buttons: ['bold'] }) as any).buttons).toEqual(['bold'])
        expect((mergeProfileConfig(profile, { controls: { paragraph: { list: { p: 'Normal' } } } }) as any).controls.paragraph.list)
            .toEqual({ p: 'Normal', blockquote: 'Quote' })
        expect(mergeProfileConfig(profile, [])).toEqual(profile)
    })
})
