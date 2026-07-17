<?php

declare(strict_types=1);

use TranquilTools\FormBuilder\Fields\Email;
use TranquilTools\FormBuilder\Fields\Password;
use TranquilTools\FormBuilder\Fields\Text;

it('adds maxlength attribute and max rule', function () {
    $schema = Text::make('name')->maxLength(255)->toSchema();

    expect($schema['maxlength'])->toBe(255)
        ->and($schema['rules'])->toBe(['max:255']);
});

it('adds minlength attribute and min rule', function () {
    $schema = Text::make('name')->minLength(3)->toSchema();

    expect($schema['minlength'])->toBe(3)
        ->and($schema['rules'])->toBe(['min:3']);
});

it('switches to an allowed input type', function () {
    expect(Text::make('x')->type('email')->toSchema()['type'])->toBe('email')
        ->and(Text::make('x')->type('password')->toSchema()['type'])->toBe('password')
        ->and(Text::make('x')->type('color')->toSchema()['type'])->toBe('color');
});

it('falls back to text for a disallowed type', function () {
    expect(Text::make('x')->type('range')->toSchema()['type'])->toBe('text');
});

it('provides email and password shortcuts', function () {
    expect(Text::make('x')->email()->toSchema()['type'])->toBe('email')
        ->and(Text::make('x')->password()->toSchema()['type'])->toBe('password');
});

it('renders dedicated Email and Password field types', function () {
    expect(Email::make('email')->toSchema()['type'])->toBe('email')
        ->and(Password::make('secret')->toSchema()['type'])->toBe('password');
});

it('supports prepend, append and tooltip decorations', function () {
    $schema = Text::make('price')
        ->prepend('€')
        ->append('.00')
        ->tooltip('Excludes VAT')
        ->toSchema();

    expect($schema['prepend'])->toBe('€')
        ->and($schema['append'])->toBe('.00')
        ->and($schema['tooltip'])->toBe('Excludes VAT');
});

it('normalizes autocomplete booleans and keeps strings', function () {
    expect(Text::make('x')->autocomplete()->toSchema()['autocomplete'])->toBe('on')
        ->and(Text::make('x')->autocomplete(false)->toSchema()['autocomplete'])->toBe('off')
        ->and(Text::make('x')->autocomplete('new-password')->toSchema()['autocomplete'])->toBe('new-password');
});
