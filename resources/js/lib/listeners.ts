import { useAttrs } from 'vue'

type Attrs = Record<string, unknown>

function isListener(key: string): boolean {
    return /^on[A-Z]/.test(key) && !key.startsWith('onUpdate:')
}

export function splitListeners(attrs: Attrs): { listeners: Attrs; rest: Attrs } {
    const entries = Object.entries(attrs)

    return {
        listeners: Object.fromEntries(entries.filter(([key]) => isListener(key))),
        rest: Object.fromEntries(entries.filter(([key]) => !isListener(key))),
    }
}

export function useFieldListeners(): { listeners: () => Attrs; wrapperAttrs: () => Attrs } {
    const attrs = useAttrs()

    return {
        listeners: () => splitListeners(attrs).listeners,
        wrapperAttrs: () => splitListeners(attrs).rest,
    }
}
