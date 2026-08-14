import Form from '@form-builder/components/Form.vue';
import HugeRteEditor from '@form-builder/wysiwyg/HugeRteEditor.vue';
import JoditEditor from '@form-builder/wysiwyg/JoditEditor.vue';
import { registerWysiwygEditor } from '@form-builder/wysiwyg/registry';
import { createApp, h } from 'vue';

/**
 * The two adapters that ship without a fixture of their own would otherwise be
 * dead code nobody compiles. This application installs both engines, registers
 * both adapters and asserts both reach the bundle, so a broken import or a
 * renamed engine entry point turns the pipeline red instead of surfacing in a
 * consumer's project.
 */
registerWysiwygEditor('hugerte', HugeRteEditor);
registerWysiwygEditor('jodit', JoditEditor);

const schema = {
    schemaVersion: '1.1',
    id: 'engines-app-form',
    action: '/',
    method: 'POST',
    fields: [
        {
            name: 'summary',
            type: 'wysiwyg',
            label: 'Summary',
            editor: 'hugerte',
        },
        {
            name: 'body',
            type: 'wysiwyg',
            label: 'Body',
            editor: 'jodit',
        },
    ],
    defaults: {},
};

createApp({
    render: () => h(Form, { schema }),
}).mount('#app');
