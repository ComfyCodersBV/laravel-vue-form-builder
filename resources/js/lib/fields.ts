import type { InjectionKey } from 'vue';
import type { Field } from '../types/form-builder';

export function flattenFields(fields: Field[] = []): Field[] {
    return fields.flatMap((field) => {
        if (field?.type === 'section' || field?.type === 'step') {
            return flattenFields(field.fields ?? []);
        }

        return [field];
    });
}

const PRESENTATIONAL_TYPES = ['display'];

export function carriesValue(field: Field): boolean {
    return !PRESENTATIONAL_TYPES.includes(field?.type ?? '');
}

export const formFieldsKey: InjectionKey<Field[]> = Symbol('form-builder-fields');
