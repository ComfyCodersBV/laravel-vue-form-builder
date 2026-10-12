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

    it('takes the columns from the schema', () => {
        const wrapper = mount(Form, { props: { schema: { ...schemaWith([textField]), schemaVersion: '1.7', columns: 3 } } });

        expect(wrapper.find('form > div').classes()).toContain('md:grid-cols-3');
    });

    it('lets the columns prop win over the schema', () => {
        const wrapper = mount(Form, { props: { schema: { ...schemaWith([textField]), columns: 3 }, columns: 1 } });

        expect(wrapper.find('form > div').classes()).not.toContain('md:grid-cols-3');
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

describe('section columns', () => {
    const section = (extra: Record<string, unknown>, fields: Record<string, unknown>[]) => ({ type: 'section', ...extra, fields })

    const gridOf = (wrapper: ReturnType<typeof mount>) => wrapper.find('[data-form-section] > .grid')

    it('lays the fields of a section out in its own columns', () => {
        const wrapper = mount(Form, {
            props: {
                schema: schemaWith([
                    section({ columns: 3 }, [
                        { name: 'street', type: 'text', columnSpan: 2 },
                        { name: 'number', type: 'text' },
                        { name: 'notes', type: 'text', columnSpan: 'full' },
                        { name: 'wide', type: 'text', columnSpan: 9 },
                    ]),
                ]),
            },
        })

        const cells = gridOf(wrapper).findAll(':scope > div')

        expect(gridOf(wrapper).classes()).toContain('md:grid-cols-3')
        expect(cells[0].classes()).toContain('md:col-span-2')
        expect(cells[1].classes()).toEqual([])
        expect(cells[2].classes()).toContain('md:col-span-3')
        expect(cells[3].classes()).toContain('md:col-span-3')
    })

    it('passes its columns on to a nested section unless that one sets its own', () => {
        const wrapper = mount(Form, {
            props: {
                schema: schemaWith([
                    section({ columns: 4 }, [
                        section({}, [textField]),
                        section({ columns: 1 }, [{ name: 'city', type: 'text' }]),
                    ]),
                ]),
            },
        })

        const nested = wrapper.findAll('[data-form-section] [data-form-section]')

        expect(nested[0].find('.grid').classes()).toContain('md:grid-cols-4')
        expect(nested[1].find('.grid').exists()).toBe(false)
    })

    it('lets a field override ask for the full width', () => {
        const wrapper = mount(Form, {
            props: { schema: schemaWith([textField]), columns: 2, fieldOverrides: { title: { fullWidth: true } } },
        })

        expect(wrapper.find('form > div > div').classes()).toContain('md:col-span-2')
    })
})
