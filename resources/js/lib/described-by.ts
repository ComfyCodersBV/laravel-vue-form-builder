import { computed, type ComputedRef } from 'vue';
import { errorIdOf, helpIdOf, useFieldId } from './field-id';
import { useFieldMeta } from './field-meta';

export interface DescribedBySource {
    name?: string;
    help?: string;
    helpText?: string;
    error?: unknown;
    extra?: unknown[];
}

export function joinIds(ids: unknown[]): string | undefined {
    const unique = [...new Set(ids.filter((id): id is string => typeof id === 'string' && id !== ''))];

    return unique.length ? unique.join(' ') : undefined;
}

export function useDescribedBy(source: () => DescribedBySource): ComputedRef<string | undefined> {
    const id = useFieldId(() => source().name);

    const meta = useFieldMeta(() => ({ helpText: source().helpText }));

    return computed(() => {
        const { help, error, extra = [] } = source();

        return joinIds([
            ...extra,
            meta.value.helpText || help ? helpIdOf(id.value) : undefined,
            error ? errorIdOf(id.value) : undefined,
        ]);
    });
}
