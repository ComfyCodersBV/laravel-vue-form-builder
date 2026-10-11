import { computed, inject, type ComputedRef, type InjectionKey } from 'vue';

export const hideLabelKey: InjectionKey<ComputedRef<boolean>> = Symbol('form-builder-hide-label');

export const VISUALLY_HIDDEN = 'sr-only';

export function useHiddenLabel(own: () => boolean | undefined): ComputedRef<boolean> {
    const injected = inject(hideLabelKey, null);

    return computed(() => own() === true || injected?.value === true);
}
