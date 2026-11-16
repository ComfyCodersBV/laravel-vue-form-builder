import type { InjectionKey, Ref } from 'vue';

export type FormLayout = 'stacked' | 'horizontal';

export const layoutKey: InjectionKey<Ref<FormLayout>> = Symbol('form-builder-layout');

export type FormColumns = 1 | 2 | 3 | 4 | 5 | 6 | 12;

export type MediumColumns = 1 | 2 | 3 | 4 | 6;

export const columnsKey: InjectionKey<Ref<FormColumns>> = Symbol('form-builder-columns');

const FULL_WIDTH_TYPES = ['wysiwyg', 'textarea', 'repeater', 'keyvalue', 'submit', 'button', 'delete', 'hidden', 'section', 'step'];

const MAX_COLUMNS = 12;

const MAX_COLUMNS_BEFORE_FULL_GRID = 6;

const MEDIUM_COLUMNS: Record<FormColumns, MediumColumns> = {
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 3,
    6: 3,
    12: 6,
};

interface SpannableField {
    type?: string;
    fullWidth?: boolean;
    columnSpan?: number | 'full';
}

export interface ResponsiveSpan {
    medium: number;
    large: number;
}

export function normalizeColumns(columns: unknown): FormColumns {
    const count = Math.round(Number(columns));

    if (!Number.isFinite(count) || count < 1) {
        return 1;
    }

    if (count >= MAX_COLUMNS) {
        return MAX_COLUMNS;
    }

    return Math.min(count, MAX_COLUMNS_BEFORE_FULL_GRID) as FormColumns;
}

export function mediumColumnsOf(columns: FormColumns): MediumColumns {
    return MEDIUM_COLUMNS[columns];
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

export function responsiveSpanOf(span: number, columns: FormColumns): ResponsiveSpan {
    const medium = mediumColumnsOf(columns);

    return {
        medium: Math.max(1, Math.min(medium, Math.ceil((span * medium) / columns))),
        large: span,
    };
}
