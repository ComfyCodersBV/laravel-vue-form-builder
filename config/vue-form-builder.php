<?php

declare(strict_types=1);

// config for TranquilTools/FormBuilder
return [

    'wysiwyg' => [

        /*
        |--------------------------------------------------------------------------
        | Default WYSIWYG editor
        |--------------------------------------------------------------------------
        |
        | This is the default editor that will be used when implementing the
        | TranquilTools\FormBuilder\Fields\Wysiwyg => =>make('content')
        | component without specifying a different ->editor('...')
        |
        */
        'default-editor' => 'quill',

        /*
        |--------------------------------------------------------------------------
        | Editor configs
        |--------------------------------------------------------------------------
        |
        |
        |
        */
        'editors' => [

            'quill' => [
                'options' => [
                    'theme' => 'snow',
                    'modules' => [
                        'toolbar' => [
                            [['font' => []], ['size' => []]],
                            ['bold', 'italic', 'underline', 'strike'],
                            [['color' => []], ['background' => []]],
                            [['script' => 'super'], ['script' => 'sub']],
                            [['header' => '1'], ['header' => '2'], 'blockquote', 'code-block'],
                            [['list' => 'ordered'], ['list' => 'bullet'], ['indent' => '-1'], ['indent' => '+1']],
                            ['direction', ['align' => []]],
                            ['link', 'image', 'video', 'formula'],
                            ['clean'],
                        ],
                        'imageResize' => [
                            'modules' => ['Resize', 'DisplaySize', 'Toolbar'],
                        ],
                    ],
                ],
            ],
        ],
    ],
];
