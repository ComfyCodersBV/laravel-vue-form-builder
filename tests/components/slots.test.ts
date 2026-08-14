import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import Form from '../../resources/js/components/Form.vue';

const textSchema = {
    schemaVersion: '1.1',
    id: 'test-form',
    action: '/',
    method: 'post',
    defaults: { title: 'stored' },
    fields: [
        {
            name: 'title',
            type: 'text',
            label: 'Title',
        },
    ],
};

const repeaterSchema = {
    schemaVersion: '1.1',
    id: 'test-form',
    action: '/',
    method: 'post',
    defaults: { rows: [{ title: 'first' }] },
    fields: [
        {
            name: 'rows',
            type: 'repeater',
            label: 'Rows',
            fields: [
                {
                    name: 'title',
                    type: 'text',
                    label: 'Title',
                },
            ],
        },
    ],
};

describe('field slots', () => {
    it('replaces a field with a slot named after it', () => {
        const wrapper = mount(Form, {
            props: { schema: textSchema },
            slots: { title: () => h('p', { class: 'by-name' }, 'replaced') },
        });

        expect(wrapper.find('.by-name').exists()).toBe(true);
        expect(wrapper.find('input').exists()).toBe(false);
    });

    it('replaces every field of a type with a slot named after the type', () => {
        const wrapper = mount(Form, {
            props: { schema: textSchema },
            slots: { text: () => h('p', { class: 'by-type' }, 'replaced') },
        });

        expect(wrapper.find('.by-type').exists()).toBe(true);
    });

    it('prefers the field name over the field type', () => {
        const wrapper = mount(Form, {
            props: { schema: textSchema },
            slots: {
                title: () => h('p', { class: 'by-name' }),
                text: () => h('p', { class: 'by-type' }),
            },
        });

        expect(wrapper.find('.by-name').exists()).toBe(true);
        expect(wrapper.find('.by-type').exists()).toBe(false);
    });

    it('hands the slot the current value and a writer that updates the form', async () => {
        let received: any = null;

        const wrapper = mount(Form, {
            props: { schema: textSchema },
            slots: {
                title: (props: any) => {
                    received = props;

                    return h('button', {
                        class: 'writer',
                        onClick: () => props['onUpdate:modelValue']('written'),
                    });
                },
            },
        });

        expect(received.modelValue).toBe('stored');
        expect(received.field.label).toBe('Title');

        await wrapper.find('.writer').trigger('click');

        expect(received.modelValue).toBe('written');
    });

    it('reaches fields nested inside a repeater', () => {
        const wrapper = mount(Form, {
            props: { schema: repeaterSchema },
            slots: { title: () => h('p', { class: 'nested' }, 'replaced') },
        });

        expect(wrapper.find('.nested').exists()).toBe(true);
    });

    it('renders the built-in component when no slot matches', () => {
        const wrapper = mount(Form, {
            props: { schema: textSchema },
            slots: { unrelated: () => h('p', { class: 'unused' }) },
        });

        expect(wrapper.find('.unused').exists()).toBe(false);
        expect(wrapper.find('input').exists()).toBe(true);
    });
});
