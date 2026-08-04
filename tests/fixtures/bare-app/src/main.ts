import Form from '@form-builder/components/Form.vue';
import { createApp, h } from 'vue';

/**
 * An application that never installs an editor engine.
 *
 * The form asks for the quill editor and nothing registers it, so this build
 * must succeed and the field must fall back to a textarea. If a future change
 * reintroduces an editor import inside the package, resolving vue-quilly or
 * quill fails here and the pipeline goes red.
 */
const schema = {
    id: 'bare-app-form',
    action: '/',
    method: 'POST',
    fields: [
        {
            name: 'body',
            type: 'wysiwyg',
            label: 'Body',
            editor: 'quill',
        },
    ],
    defaults: {},
};

createApp({
    render: () => h(Form, { schema }),
}).mount('#app');
