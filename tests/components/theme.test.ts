import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import Form from '../../resources/js/components/Form.vue';
import { DEFAULT_THEME } from '../../resources/js/lib/theme';

const schemaWith = (extra: Record<string, unknown> = {}, field: Record<string, unknown> = {}) => ({
    schemaVersion: '1.1',
    id: 'test-form',
    action: '/',
    method: 'post',
    defaults: {},
    fields: [
        {
            name: 'title',
            type: 'text',
            label: 'Title',
            help: 'Helpful',
            ...field,
        },
    ],
    ...extra,
});

const wrapperOf = (schema: Record<string, unknown>) =>
    mount(Form, { props: { schema } }).find('form > div');

describe('theme', () => {
    it('falls back to the renderer defaults when the schema carries no theme', () => {
        const wrapper = wrapperOf(schemaWith());

        expect(wrapper.classes()).toContain('space-y-1');
        expect(wrapper.find('label').classes().join(' ')).toBe(DEFAULT_THEME.label);
    });

    it('merges the schema theme over the defaults, keeping non-conflicting utilities', () => {
        const wrapper = wrapperOf(schemaWith({ theme: { label: 'text-rose-700' } }));
        const label = wrapper.find('label').classes();

        expect(label).toContain('text-rose-700');
        expect(label).toContain('font-medium');
        expect(label).not.toContain('text-neutral-800');
    });

    it('lets a field theme override the schema theme for that field only', () => {
        const wrapper = wrapperOf(
            schemaWith({ theme: { label: 'text-rose-700' } }, { theme: { label: 'text-sky-700' } }),
        );

        expect(wrapper.find('label').classes()).toContain('text-sky-700');
        expect(wrapper.find('label').classes()).not.toContain('text-rose-700');
    });

    it('ignores empty theme values rather than blanking the default', () => {
        const wrapper = wrapperOf(schemaWith({ theme: { label: '', help: undefined } }));

        expect(wrapper.find('label').classes().join(' ')).toBe(DEFAULT_THEME.label);
    });

    it('keeps className replacing the wrapper outright', () => {
        const wrapper = wrapperOf(
            schemaWith({ theme: { wrapper: 'space-y-8' } }, { className: 'flex gap-2' }),
        );

        expect(wrapper.classes()).toEqual(['flex', 'gap-2']);
    });

    it('themes the error and help elements too', () => {
        const wrapper = wrapperOf(
            schemaWith({ theme: { help: 'text-xs italic', error: 'text-orange-600' } }),
        );

        expect(wrapper.find('div > div + div').classes()).toContain('italic');
    });
});
