# Steps

A long form can be split into steps that are shown one at a time, with a step indicator ("Step 1 of 3"), large
**Back** and **Next** buttons and the submit button on the last step. Wrap the fields of each step in a `Step`:

```php
use TranquilTools\FormBuilder\Fields\Step;

public function fields(): array
{
    return [
        Step::make('when')
            ->title('When and where')
            ->fields([
                Select::make('room_id')->label('Room')->rules(['required']),
                DateTime::make('starts_at')->label('Starts at')->touchPicker()->rules(['required']),
            ]),

        Step::make('who')
            ->title('Renter')
            ->description('Pick an existing renter or add a new one.')
            ->fields([
                Select::make('renter_id')->label('Renter')->searchable()->if("type === 'rental'"),
            ]),

        Step::make('details')
            ->title('Details')
            ->fields([
                Textarea::make('notes')->label('Notes'),
            ]),

        Submit::make()->label('Save'),
    ];
}
```

- A `Step` is a `Section`: it takes `title()`, `description()` and `columns()`, and its fields' rules are part of the
  form's `rules()` as usual. The name (`when`) identifies the step for the slots below; without one the steps are
  called `step-1`, `step-2` and so on.
- Fields outside the steps are shown on the last step, below its own fields. A `Submit` field outside the steps is not
  rendered as such: its label becomes the label of the submit button on the last step.
- A step whose fields are all hidden by their `->if()` condition is skipped, and the step indicator counts it out. A
  `Step` can have an `->if()` of its own as well.
- Pressing Enter in a field moves to the next step instead of submitting the form.
- When the submit fails with validation errors, the form jumps back to the first step that has one, and that step is
  marked red in the indicator.
- The step indicator gives every visible step the same width. A long title wraps to two lines and is then cut off.
  On a phone (below 640 px) it shows only the numbered circles, and the current step's title is the heading below.
- Earlier steps can be reopened with **Back** or by tapping their number. Later steps are only reached with **Next**.

## Keeping the step across a reload

Pass `remember` to `<Form>` to keep the typed values and the current step when the page is reloaded halfway, see
[Vue Usage](vue-usage.md#remembering-the-values-across-a-reload):

```vue
<Form :schema="form" remember />
```

## Validating each step on the server

By default **Next** moves on without a check, and the server validates everything on submit. With
`validateSteps()`, **Next** first asks the server to validate the fields of the current step, with a
[Laravel Precognition](https://laravel.com/docs/precognition) request, and only moves on when they pass:

```php
public function configure(FormConfig $form): void
{
    $form->validateSteps();
}
```

The route the form submits to **must** use the `HandlePrecognitiveRequests` middleware, otherwise the request runs
the controller and saves the form:

```php
use Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests;

Route::resource('bookings', BookingController::class)
    ->middlewareFor(['store', 'update'], HandlePrecognitiveRequests::class);
```

- The controller action must validate with a form request (a `FormRequest` parameter, for example one whose
  `rules()` returns `YourForm::rules()`). Precognition runs the form request and stops before the action itself, so
  validating inside the action with `YourForm::make()->validate($request)` checks nothing and every step passes.
- The request goes to the form's action with the form's method (spoofed with `_method`), the whole form as JSON and
  `Precognition-Validate-Only` set to the visible fields of the step. Your form request validates only those, so a
  rule like `after:starts_at` still sees the other values. Authorisation runs as usual.
- A `204` with the `Precognition: true` header counts as valid. A `422` shows the errors at the fields and keeps the
  step. Anything else (a `500`, a dropped connection, a `204` without the header) keeps the step and shows "Checking
  this step failed, try again".
- File fields are left out of the step check and are validated on submit.
- A form with method `GET` never checks its steps.

## Slots

Each step has two slots on `<Form>`, `step-{name}-before` and `step-{name}-after`, rendered above and below the step's
fields. They receive `form` and `step`:

```vue
<Form :schema="form">
    <template #step-who-after="{ form }">
        <button type="button" @click="openRenterDialog">+ New renter</button>
    </template>

    <template #step-details-before="{ form }">
        <BookingSummary :values="form" />
    </template>
</Form>
```

The step texts ("Step 1 of 3", "Back", "Next", "Save", "Checking...") are in the form messages under `stepOf`,
`previousStep`, `nextStep`, `save` and `checkingStep`, see [Vue Usage](vue-usage.md).

Requires `tranquil-tools/laravel-form-builder` 1.10 and `laravel-vue-form-builder` 1.14 or newer.
