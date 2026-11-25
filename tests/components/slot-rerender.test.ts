import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import Form from '../../resources/js/components/Form.vue';

const schema = {
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

function parentForwarding(slotName: string) {
    const renders = ref(0);

    const Parent = defineComponent({
        setup() {
            return () => h(
                'div',
                { 'data-renders': renders.value },
                h(Form, { schema }, {
                    [slotName]: (props: any) => h('input', {
                        class: 'custom',
                        value: props.modelValue,
                        onInput: (event: Event) => props['onUpdate:modelValue']((event.target as HTMLInputElement).value),
                    }),
                }),
            );
        },
    });

    return { Parent, renders };
}

describe('slots across a re-render of the parent', () => {
    it('keeps the element of a field slot, so a focused input stays focused', async () => {
        const { Parent, renders } = parentForwarding('title');
        const wrapper = mount(Parent, { attachTo: document.body });
        const input = wrapper.find('input.custom').element as HTMLInputElement;

        input.focus();
        renders.value++;
        await nextTick();
        await wrapper.find('input.custom').setValue('typed');

        expect(wrapper.find('input.custom').element).toBe(input);
        expect(document.activeElement).toBe(input);
        expect(input.value).toBe('typed');

        wrapper.unmount();
    });

    it('keeps the element of an input slot, so a focused input stays focused', async () => {
        const { Parent, renders } = parentForwarding('input-title');
        const wrapper = mount(Parent, { attachTo: document.body });
        const input = wrapper.find('input.custom').element as HTMLInputElement;

        input.focus();
        renders.value++;
        await nextTick();
        await wrapper.find('input.custom').setValue('typed');

        expect(wrapper.find('input.custom').element).toBe(input);
        expect(document.activeElement).toBe(input);
        expect(input.value).toBe('typed');

        wrapper.unmount();
    });

    it('renders the slot again with the new slot function after a re-render', async () => {
        const label = ref('first');
        const Parent = defineComponent({
            setup() {
                return () => h(Form, { schema }, {
                    title: () => h('p', { class: 'label' }, label.value),
                });
            },
        });
        const wrapper = mount(Parent);

        label.value = 'second';
        await nextTick();

        expect(wrapper.find('.label').text()).toBe('second');
    });
});
