import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import Form from '../../resources/js/components/Form.vue';

const schemaWith = (fields: Record<string, unknown>[]) => ({
    schemaVersion: '1.1',
    id: 'test-form',
    action: '/',
    method: 'post',
    defaults: {},
    fields,
});

const textField = { name: 'title', type: 'text', label: 'Title' };

describe('form layout', () => {
    it('renders a single column without wrapping the fields in a container', () => {
        const wrapper = mount(Form, { props: { schema: schemaWith([textField]) } });

        expect(wrapper.find('form > div').classes()).toContain('space-y-1');
    });

    it('puts a two column form in a grid', () => {
        const wrapper = mount(Form, { props: { schema: schemaWith([textField]), columns: 2 } });

        expect(wrapper.find('form > div').classes()).toContain('md:grid-cols-2');
    });

    it('lets a textarea span both columns', () => {
        const schema = schemaWith([textField, { name: 'body', type: 'textarea', label: 'Body' }]);
        const wrapper = mount(Form, { props: { schema, columns: 2 } });

        const cells = wrapper.findAll('form > div > div');

        expect(cells[0].classes()).not.toContain('md:col-span-2');
        expect(cells[1].classes()).toContain('md:col-span-2');
    });

    it('honours fullWidth on a field the type list does not cover', () => {
        const schema = schemaWith([{ ...textField, fullWidth: true }]);
        const wrapper = mount(Form, { props: { schema, columns: 2 } });

        expect(wrapper.find('form > div > div').classes()).toContain('md:col-span-2');
    });

    it('leaves the field markup alone in a stacked layout', () => {
        const wrapper = mount(Form, { props: { schema: schemaWith([textField]) } });

        expect(wrapper.find('form > div').classes()).not.toContain('sm:flex');
    });

    it('lines a horizontal field up next to its label', () => {
        const wrapper = mount(Form, { props: { schema: schemaWith([textField]), layout: 'horizontal' } });

        expect(wrapper.find('form > div').classes()).toContain('sm:flex');
        expect(wrapper.find('form > div > label').classes()).toContain('sm:w-40');
    });

    it('keeps a label-less field stacked even in a horizontal form', () => {
        const schema = schemaWith([{ name: 'title', type: 'text' }]);
        const wrapper = mount(Form, { props: { schema, layout: 'horizontal' } });

        expect(wrapper.find('form > div').classes()).not.toContain('sm:flex');
    });
});
