import { mount } from '@vue/test-utils';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';
import FormField from '../../resources/js/components/FormField.vue';

function mountField(field: Record<string, unknown>, overrides: Record<string, unknown>) {
    return mount(FormField, {
        attachTo: document.body,
        props: {
            field: { name: 'subject', ...field },
            form: reactive({ subject: '', errors: {} }),
            fieldOverrides: { subject: overrides },
        },
    });
}

const elements: Array<[string, Record<string, unknown>, string]> = [
    ['button', { type: 'button', label: 'Preview' }, 'button'],
    ['submit', { type: 'submit', label: 'Save' }, 'button[type="submit"]'],
    ['text', { type: 'text', label: 'Subject' }, 'input#subject'],
    ['email', { type: 'email', label: 'Subject' }, 'input#subject'],
    ['textarea', { type: 'textarea', label: 'Subject' }, 'textarea#subject'],
    ['number', { type: 'number', label: 'Subject' }, 'input#subject'],
    ['money', { type: 'money', label: 'Subject' }, 'input#subject'],
    ['color', { type: 'color', label: 'Subject' }, 'input#subject'],
    ['time', { type: 'time', label: 'Subject' }, 'input#subject'],
    ['file', { type: 'file', label: 'Subject' }, 'input#subject'],
    ['date', { type: 'date', label: 'Subject' }, 'button#subject'],
    ['select', { type: 'select', label: 'Subject', options: { a: 'A' } }, '#subject'],
    ['searchable select', { type: 'select', label: 'Subject', options: { a: 'A' }, searchable: true }, 'button#subject'],
    ['checkbox', { type: 'checkbox', label: 'Subject' }, '#subject-cb'],
    ['toggle', { type: 'toggle', label: 'Subject' }, '#subject-tgl'],
    ['tags', { type: 'tags', label: 'Subject' }, 'input#subject'],
];

describe('listeners from fieldOverrides', () => {
    beforeAll(() => {
        vi.stubGlobal('ResizeObserver', class {
            observe() {}
            unobserve() {}
            disconnect() {}
        });
    });

    it.each(elements)('puts onClick of a %s on its interactive element', async (_, field, selector) => {
        const onClick = vi.fn();
        const wrapper = mountField(field, { onClick });

        await wrapper.get(selector).trigger('click');

        expect(onClick).toHaveBeenCalledTimes(1);

        wrapper.unmount();
    });

    it.each(elements.filter(([name]) => !['button', 'submit'].includes(name)))(
        'keeps onClick of a %s off its wrapper',
        async (_, field) => {
            const onClick = vi.fn();
            const wrapper = mountField(field, { onClick });

            await wrapper.trigger('click');

            expect(onClick).not.toHaveBeenCalled();

            wrapper.unmount();
        },
    );

    it('puts onFocus and onBlur on the input', async () => {
        const onFocus = vi.fn();
        const onBlur = vi.fn();
        const wrapper = mountField({ type: 'text', label: 'Subject' }, { onFocus, onBlur });

        await wrapper.get('input#subject').trigger('focus');
        await wrapper.get('input#subject').trigger('blur');

        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).toHaveBeenCalledTimes(1);

        wrapper.unmount();
    });

    it('runs a listener next to the field its own handler', async () => {
        const onBlur = vi.fn();
        const form = reactive<Record<string, any>>({ subject: '', errors: {} });
        const wrapper = mount(FormField, {
            props: {
                field: { name: 'subject', type: 'money', label: 'Subject' },
                form,
                fieldOverrides: { subject: { onBlur } },
            },
        });

        const input = wrapper.get('input#subject');
        await input.setValue('12,5');
        await input.trigger('blur');

        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(form.subject).toBe(1250);
    });

    it('puts onClick on a button that asks for confirmation', async () => {
        const onClick = vi.fn();
        const wrapper = mountField({ type: 'button', label: 'Preview', confirmTitle: 'Sure?' }, { onClick });

        await wrapper.get('[data-testid="field-subject"]').trigger('click');

        expect(onClick).toHaveBeenCalledTimes(1);

        wrapper.unmount();
    });
});
