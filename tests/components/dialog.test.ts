import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { Dialog, DialogContent, DialogTitle } from '../../resources/js/components/ui/dialog';

function openDialog(contentProps: Record<string, unknown> = {}) {
    return mount(defineComponent({
        setup: () => () => h(Dialog, { open: true }, {
            default: () => h(DialogContent, contentProps, {
                default: () => [h(DialogTitle, () => 'Title'), h('button', { id: 'inside' }, 'Inside')],
            }),
        }),
    }), { attachTo: document.body });
}

function content(): HTMLElement {
    return document.querySelector('[role="dialog"]') as HTMLElement;
}

describe('DialogContent', () => {
    afterEach(() => {
        document.body.innerHTML = '';
        document.body.removeAttribute('style');
    });

    it('keeps the content clickable while a modal dialog disables pointer events on the page', async () => {
        const wrapper = openDialog();
        await flushPromises();

        expect(document.body.style.pointerEvents).toBe('none');
        expect(content().style.pointerEvents).toBe('auto');

        wrapper.unmount();
    });

    it('lets the owner cancel a dismissal through the forwarded events', async () => {
        let intercepted = false;
        const wrapper = openDialog({
            onEscapeKeyDown: (event: Event) => {
                intercepted = true;
                event.preventDefault();
            },
        });
        await flushPromises();

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await flushPromises();

        expect(intercepted).toBe(true);
        expect(content()).not.toBeNull();

        wrapper.unmount();
    });
});
