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
        | Editor-specific configurations
        |
        */
        'editors' => [

            'quill' => [
                'options' => [
                    'theme' => 'snow',
                    'formats' => [
                        'bold', 'italic', 'underline', 'strike',
                        'blockquote', 'code-block',
                        'header',
                        'list', 'indent',
                        'link', 'image', 'video',
                        'color', 'background',
                        'font', 'size',
                        'align', 'direction',
                        'script',
                    ],
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


    /*
    |--------------------------------------------------------------------------
    | (Optional) reCAPTCHA Configuration
    |--------------------------------------------------------------------------
    |
    | Configure reCAPTCHA v3 settings
    |
    */

    'recaptcha' => [
        /*
         * The reCAPTCHA site key (public key)
         */
        'site_key' => env('RECAPTCHA_SITE_KEY', ''),

        /*
         * The reCAPTCHA secret key (private key)
         */
        'secret_key' => env('RECAPTCHA_SECRET_KEY', ''),

        /*
         * Default action name for reCAPTCHA verification
         */
        'default_action' => 'submit',

        /*
         * Default minimum score threshold (0.0 to 1.0)
         * 1.0 is very likely a good interaction, 0.0 is very likely a bot
         */
        'default_score' => 0.5,

        /*
         * Enable or disable reCAPTCHA verification
         */
        'enabled' => env('RECAPTCHA_ENABLED', true),
    ],
];
