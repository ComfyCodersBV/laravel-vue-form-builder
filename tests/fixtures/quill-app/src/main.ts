import Form from '@form-builder/components/Form.vue';
import QuillEditor from '@form-builder/wysiwyg/QuillEditor.vue';
import { registerWysiwygEditor } from '@form-builder/wysiwyg/registry';
import { createApp, h } from 'vue';
import 'quill/dist/quill.snow.css';

/**
 * The other half of the contract: an application that does install the engine
 * and registers the adapter. This build proves the documented registration
 * snippet still resolves, so the bare-app fixture cannot pass by accident
 * through the adapter having been broken or moved.
 */
registerWysiwygEditor('quill', QuillEditor);

const schema = {
    id: 'quill-app-form',
    action: '/',
    method: 'POST',
    fields: [
        {
            name: 'body',
            type: 'wysiwyg',
            label: 'Body',
            editor: 'quill',
            options: {
                theme: 'snow',
            },
        },
    ],
    defaults: {},
};

createApp({
    render: () => h(Form, { schema }),
}).mount('#app');
