import type { InjectionKey, Slots } from 'vue';
import type { Field } from '../types/form-builder';

/**
 * Slots passed to `<Form>` that replace the rendering of a field entirely.
 *
 * A slot named after a field wins over one named after its type, because
 * "this one field is different" is the common case and "every field of this
 * type is different" is the broad stroke.
 *
 * Slots travel by injection rather than by template forwarding so that fields
 * nested inside a Repeater — rendered by a second FormRenderer — honour them
 * too, without every level having to pass them along by hand.
 */
export const fieldSlotsKey: InjectionKey<Slots> = Symbol('form-builder-field-slots');

export interface FieldSlotProps {
    field: Field;
    form: any;
    error: unknown;
    modelValue: any;
    'onUpdate:modelValue': (value: any) => void;
}

export interface InputSlotProps {
    id: string | undefined;
    name: string | undefined;
    describedby: string | undefined;
    invalid: boolean;
    required: boolean;
    disabled: boolean;
    readonly: boolean;
    field: Field;
    form: any;
    error: string | string[] | undefined;
    modelValue: any;
    update: (value: any) => void;
    'onUpdate:modelValue': (value: any) => void;
}

export function inputSlotName(fieldName: string): string {
    return `input-${fieldName}`;
}
