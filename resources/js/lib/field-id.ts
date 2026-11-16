import { computed, inject, provide, type ComputedRef, type InjectionKey } from 'vue';

export const fieldIdPrefixKey: InjectionKey<ComputedRef<string | undefined>> = Symbol('form-builder-field-id-prefix');

export function fieldId(prefix: string | undefined, name: string | undefined): string | undefined {
    if (!name) {
        return undefined;
    }

    return prefix ? `${prefix}-${name}` : name;
}

export function useFieldIdPrefix(): ComputedRef<string | undefined> {
    return inject(fieldIdPrefixKey, computed(() => undefined));
}

export function provideFieldIdPrefix(prefix: () => string | undefined): void {
    provide(fieldIdPrefixKey, computed(prefix));
}

export function useFieldId(name: () => string | undefined): ComputedRef<string | undefined> {
    const prefix = useFieldIdPrefix();

    return computed(() => fieldId(prefix.value, name()));
}

export function helpIdOf(id: string | undefined): string | undefined {
    return id ? `${id}-help` : undefined;
}

export function errorIdOf(id: string | undefined): string | undefined {
    return id ? `${id}-error` : undefined;
}
