declare module '@hugerte/hugerte-vue' {
    import type { DefineComponent } from 'vue'

    const Editor: DefineComponent<Record<string, unknown>>

    export default Editor
}
