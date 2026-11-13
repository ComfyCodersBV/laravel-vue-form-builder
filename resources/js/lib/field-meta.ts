import { computed, inject, type ComputedRef, type InjectionKey } from 'vue';

export interface FieldMeta {
    markRequired: boolean;
    helpText?: string;
}

export const fieldMetaKey: InjectionKey<ComputedRef<FieldMeta>> = Symbol('form-builder-field-meta');

export function useFieldMeta(own: () => Partial<FieldMeta>): ComputedRef<FieldMeta> {
    const injected = inject(fieldMetaKey, null);

    return computed(() => {
        const props = own();

        return {
            markRequired: props.markRequired ?? injected?.value.markRequired ?? false,
            helpText: props.helpText ?? injected?.value.helpText,
        };
    });
}
