<?php

declare(strict_types=1);

use TranquilTools\FormBuilder\Fields\Date;
use TranquilTools\FormBuilder\Fields\DateTime;

it('renders the date type', function () {
    expect(Date::make('published_at')->toSchema()['type'])->toBe('date');
});

it('toggles range mode', function () {
    expect(Date::make('period')->range()->toSchema()['range'])->toBeTrue()
        ->and(Date::make('period')->range()->range(false)->toSchema())->not->toHaveKey('range');
});

it('enables time selection', function () {
    expect(Date::make('at')->enableTime()->toSchema()['enableTime'])->toBeTrue();
});

it('stores min and max dates', function () {
    $schema = Date::make('at')->minDate('2026-01-01')->maxDate('2026-12-31')->toSchema();

    expect($schema['minDate'])->toBe('2026-01-01')
        ->and($schema['maxDate'])->toBe('2026-12-31');
});

it('clamps the week start to sunday or monday', function () {
    expect(Date::make('at')->weekStartsOn(1)->toSchema()['weekStartsOn'])->toBe(1)
        ->and(Date::make('at')->weekStartsOn(5)->toSchema()['weekStartsOn'])->toBe(0);
});

it('stores format and locale', function () {
    $schema = Date::make('at')->format('d-m-Y')->locale('nl')->toSchema();

    expect($schema['format'])->toBe('d-m-Y')
        ->and($schema['locale'])->toBe('nl');
});

it('DateTime enables time and uses the date type', function () {
    $schema = DateTime::make('at')->toSchema();

    expect($schema['type'])->toBe('date')
        ->and($schema['enableTime'])->toBeTrue();
});
