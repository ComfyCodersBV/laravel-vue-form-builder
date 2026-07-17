<?php

declare(strict_types=1);

use TranquilTools\FormBuilder\Fields\Recaptcha;

it('defaults to the g-recaptcha-response name', function () {
    expect(Recaptcha::make()->getName())->toBe('g-recaptcha-response');
});

it('builds a validation rule from action and score defaults', function () {
    expect(Recaptcha::make()->getRules())->toBe(['recaptcha:submit,0.5']);
});

it('builds a validation rule from overridden action and score', function () {
    $rules = Recaptcha::make()
        ->action('contact_form')
        ->minScore(0.7)
        ->getRules();

    expect($rules)->toBe(['recaptcha:contact_form,0.7']);
});

it('exposes action and site key in the schema', function () {
    $schema = Recaptcha::make()
        ->action('contact_form')
        ->siteKey('test-key')
        ->toSchema();

    expect($schema['type'])->toBe('recaptcha')
        ->and($schema['action'])->toBe('contact_form')
        ->and($schema['siteKey'])->toBe('test-key');
});
