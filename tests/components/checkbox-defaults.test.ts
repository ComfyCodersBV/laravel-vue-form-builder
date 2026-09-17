import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import Form from '../../resources/js/components/Form.vue';

function schemaWith(fields: Record<string, any>[], defaults: Record<string, any> = {}) {
    return {
        schemaVersion: '1.1',
        id: 'test-form',
        action: '/',
        method: 'post',
        defaults,
        fields,
    };
}

function formDataOf(schema: Record<string, any>) {
    const wrapper = mount(Form, { props: { schema } });

    return (wrapper.findComponent({ name: 'FormRenderer' }).props('form') as any).data();
}

const checkbox = { name: 'is_active', type: 'checkbox', value: '1', falseValue: '0' };

describe('checkbox initial values', () => {
    it('starts an untouched checkbox on its false value rather than an empty string', () => {
        expect(formDataOf(schemaWith([checkbox])).is_active).toBe('0');
    });

    it('honours the false value the field declares', () => {
        const schema = schemaWith([{ ...checkbox, falseValue: 'nee' }]);

        expect(formDataOf(schema).is_active).toBe('nee');
    });

    it('keeps the default when the field has one', () => {
        const schema = schemaWith([{ ...checkbox, default: true }]);

        expect(formDataOf(schema).is_active).toBe(true);
    });

    it('keeps a stored false rather than reading it as untouched', () => {
        const schema = schemaWith([{ ...checkbox, default: true }], { is_active: false });

        expect(formDataOf(schema).is_active).toBe(false);
    });

    it('keeps a stored true', () => {
        const schema = schemaWith([checkbox], { is_active: true });

        expect(formDataOf(schema).is_active).toBe(true);
    });

    it('replaces a stored null, which a nullable column hands back', () => {
        const schema = schemaWith([checkbox], { is_active: null });

        expect(formDataOf(schema).is_active).toBe('0');
    });

    it('treats a toggle the same way', () => {
        const schema = schemaWith([{ name: 'on_dev_board', type: 'toggle', value: '1', falseValue: '0' }]);

        expect(formDataOf(schema).on_dev_board).toBe('0');
    });

    it('leaves other field types on an empty string', () => {
        const schema = schemaWith([{ name: 'title', type: 'text' }]);

        expect(formDataOf(schema).title).toBe('');
    });
});
