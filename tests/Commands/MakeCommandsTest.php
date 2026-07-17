<?php

declare(strict_types=1);

use Illuminate\Support\Facades\File;

afterEach(function () {
    File::delete(app_path('Forms/ContactForm.php'));
    File::delete(app_path('Http/Requests/ContactFormRequest.php'));
});

it('generates a form class', function () {
    $this->artisan('make:form', [
        'name' => 'ContactForm',
        '--request' => true,
        '--force' => true,
    ])->assertSuccessful();

    $path = app_path('Forms/ContactForm.php');

    expect(File::exists($path))->toBeTrue()
        ->and(File::get($path))->toContain('class ContactForm');
});

it('generates the accompanying form request', function () {
    $this->artisan('make:form', [
        'name' => 'ContactForm',
        '--request' => true,
        '--force' => true,
    ])->assertSuccessful();

    $path = app_path('Http/Requests/ContactFormRequest.php');

    expect(File::exists($path))->toBeTrue()
        ->and(File::get($path))->toContain('class ContactFormRequest');
});

it('generates a standalone form request', function () {
    $this->artisan('make:form-request', [
        'name' => 'ContactFormRequest',
    ])->assertSuccessful();

    expect(File::exists(app_path('Http/Requests/ContactFormRequest.php')))->toBeTrue();
});
