import type { InjectionKey, Ref } from 'vue';

export type FormLayout = 'stacked' | 'horizontal';

export const layoutKey: InjectionKey<Ref<FormLayout>> = Symbol('form-builder-layout');

export type FormColumns = 1 | 2 | 3 | 4;

export const columnsKey: InjectionKey<Ref<FormColumns>> = Symbol('form-builder-columns');

const FULL_WIDTH_TYPES = ['wysiwyg', 'textarea', 'repeater', 'keyvalue', 'submit', 'button', 'delete', 'hidden', 'section'];

interface SpannableField {
    type?: string;
    fullWidth?: boolean;
    columnSpan?: number | 'full';
}

export function normalizeColumns(columns: unknown): FormColumns {
    const count = Math.round(Number(columns));

    if (!Number.isFinite(count) || count < 1) {
        return 1;
    }

    return Math.min(count, 4) as FormColumns;
}

export function spanOf(field: SpannableField, columns: FormColumns): number {
    if (field.columnSpan === 'full' || field.fullWidth === true) {
        return columns;
    }

    if (typeof field.columnSpan === 'number') {
        return Math.max(1, Math.min(columns, Math.round(field.columnSpan)));
    }

    return FULL_WIDTH_TYPES.includes(field.type ?? '') ? columns : 1;
}
