import type { InjectionKey } from 'vue';
import type { Field } from '../types/form-builder';

export function flattenFields(fields: Field[] = []): Field[] {
    return fields.flatMap((field) => {
        if (field?.type === 'section') {
            return flattenFields(field.fields ?? []);
        }

        return [field];
    });
}

export const formFieldsKey: InjectionKey<Field[]> = Symbol('form-builder-fields');
