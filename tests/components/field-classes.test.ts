import { mount } from '@vue/test-utils';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';
import FormField from '../../resources/js/components/FormField.vue';

function mountField(field: Record<string, unknown>, value: unknown = '') {
    return mount(FormField, {
        props: {
            field: { name: 'subject', label: 'Subject', ...field },
            form: reactive({ subject: value, errors: {} }),
        },
    });
}

const elements: Array<[string, Record<string, unknown>, string, unknown?]> = [
    ['text', { type: 'text' }, 'input#subject'],
    ['password', { type: 'password' }, 'input#subject'],
    ['textarea', { type: 'textarea' }, 'textarea#subject'],
    ['number', { type: 'number' }, 'input#subject'],
    ['money', { type: 'money' }, 'input#subject'],
    ['color', { type: 'color' }, 'input#subject'],
    ['time', { type: 'time' }, 'input#subject'],
    ['file', { type: 'file' }, 'input#subject'],
    ['date', { type: 'date' }, 'button#subject'],
    ['touch date', { type: 'date', touch: true }, 'button#subject'],
    ['select', { type: 'select', options: { a: 'A' } }, '#subject'],
    ['searchable select', { type: 'select', options: { a: 'A' }, searchable: true }, 'button#subject'],
    ['multiple select', { type: 'select', options: { a: 'A' }, multiple: true }, 'button[aria-haspopup="dialog"]'],
    ['checkbox', { type: 'checkbox' }, '#subject-cb'],
    ['checkboxes', { type: 'checkboxes', options: { a: 'A' } }, '#subject-a', []],
    ['checkbox buttons', { type: 'checkboxes', options: { a: 'A' }, buttons: true }, 'button', []],
    ['radios', { type: 'radios', options: { a: 'A' } }, '#subject-a'],
    ['radio tiles', { type: 'radios', options: { a: 'A' }, tiles: true }, '[data-option="a"]'],
    ['toggle', { type: 'toggle' }, '#subject-tgl'],
    ['tags', { type: 'tags' }, '[data-tags-input]', []],
    ['key-value', { type: 'keyvalue' }, 'input:not([type="hidden"])', { a: 'b' }],
    ['wysiwyg', { type: 'wysiwyg' }, 'textarea'],
    ['button', { type: 'button' }, 'button'],
    ['submit', { type: 'submit' }, 'button[type="submit"]'],
    ['delete', { type: 'delete', deleteUrl: '/x' }, 'button'],
];

describe('field classes', () => {
    beforeAll(() => {
        vi.stubGlobal('ResizeObserver', class {
            observe() {}
            unobserve() {}
            disconnect() {}
        });
    });

    it.each(elements)('puts inputClassName on the element of a %s', (_, field, selector, value) => {
        const wrapper = mountField({ ...field, inputClassName: 'agent-input' }, value ?? '');

        expect(wrapper.get(selector).classes()).toContain('agent-input');
        expect(wrapper.findAll('.agent-input').every((element) => element.find('label').exists() === false)).toBe(true);
    });

    it('puts inputClassName on each locale of a translatable field', () => {
        const wrapper = mountField({
            type: 'translatable',
            inputClassName: 'agent-input',
            locales: [{ value: 'en', label: 'English' }, { value: 'nl', label: 'Dutch' }],
            field: { type: 'text' },
        }, {});

        expect(wrapper.findAll('input.agent-input')).toHaveLength(2);
    });

    it('replaces the wrapper class with wrapperClassName', () => {
        const wrapper = mountField({ type: 'text', wrapperClassName: 'agent-wrapper' });

        expect(wrapper.classes()).toEqual(['agent-wrapper']);
        expect(wrapper.attributes()).not.toHaveProperty('wrapperclassname');
    });

    it('takes wrapperClassName and inputClassName from fieldOverrides', () => {
        const wrapper = mount(FormField, {
            props: {
                field: { name: 'subject', label: 'Subject', type: 'text', className: 'from-schema' },
                form: reactive({ subject: '', errors: {} }),
                fieldOverrides: { subject: { wrapperClassName: 'agent-wrapper', inputClassName: 'agent-input' } },
            },
        });

        expect(wrapper.classes()).toEqual(['agent-wrapper']);
        expect(wrapper.get('input').classes()).toContain('agent-input');
    });

    it('keeps className as the wrapper class of an older schema', () => {
        const wrapper = mountField({ type: 'text', className: 'agent-wrapper' });

        expect(wrapper.classes()).toEqual(['agent-wrapper']);
        expect(wrapper.get('input').classes()).not.toContain('agent-wrapper');
    });

    it('prefers wrapperClassName over className', () => {
        const wrapper = mountField({ type: 'text', className: 'old', wrapperClassName: 'new' });

        expect(wrapper.classes()).toEqual(['new']);
    });

    it('sets the wrapper and the element class side by side', () => {
        const wrapper = mountField({ type: 'text', className: 'agent-wrapper', inputClassName: 'agent-input' });

        expect(wrapper.classes()).toEqual(['agent-wrapper']);
        expect(wrapper.get('input').classes()).toContain('agent-input');
        expect(wrapper.get('input').classes()).toContain('rounded-md');
    });

    it('lets inputClassName win over a conflicting default utility', () => {
        const wrapper = mountField({ type: 'text', inputClassName: 'h-12' });

        expect(wrapper.get('input').classes()).toContain('h-12');
        expect(wrapper.get('input').classes()).not.toContain('h-9');
    });

    it('applies the wrapper class of a section to the section', () => {
        const wrapper = mountField({ type: 'section', name: undefined, wrapperClassName: 'agent-section', fields: [] });

        expect(wrapper.get('[data-form-section]').classes()).toEqual(['agent-section']);
    });

    it('merges className and inputClassName on a button, which has no wrapper', () => {
        const wrapper = mountField({ type: 'button', className: 'agent-wrapper', inputClassName: 'agent-input' });

        expect(wrapper.get('button').classes()).toEqual(expect.arrayContaining(['agent-wrapper', 'agent-input']));
    });
});
