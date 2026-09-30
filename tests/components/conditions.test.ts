import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
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

function mountWith(type: string, value: any) {
    const wrapper = mount(Form, {
        props: {
            schema: schemaWith(
                [
                    { name: 'is_sandbox', type, value: '1', falseValue: '0' },
                    { name: 'suffix', type: 'text', condition: 'form.is_sandbox' },
                ],
                { is_sandbox: value },
            ),
        },
    });

    return wrapper;
}

function form(wrapper: ReturnType<typeof mount>) {
    return wrapper.findComponent({ name: 'FormRenderer' }).props('form') as any;
}

describe('conditions on a checkbox or toggle', () => {
    for (const type of ['checkbox', 'toggle']) {
        it(`hides the dependent field while the ${type} holds its false value`, () => {
            expect(mountWith(type, '0').find('input[name="suffix"]').exists()).toBe(false);
        });

        it(`shows the dependent field while the ${type} holds its true value`, () => {
            expect(mountWith(type, '1').find('input[name="suffix"]').exists()).toBe(true);
        });

        it(`follows the ${type} when it is switched off and on again`, async () => {
            const wrapper = mountWith(type, true);

            form(wrapper).is_sandbox = '0';
            await nextTick();

            expect(wrapper.find('input[name="suffix"]').exists()).toBe(false);

            form(wrapper).is_sandbox = '1';
            await nextTick();

            expect(wrapper.find('input[name="suffix"]').exists()).toBe(true);
        });
    }

    it('keeps submitting the values the field declares', () => {
        expect(form(mountWith('checkbox', '0')).data().is_sandbox).toBe('0');
    });
});
