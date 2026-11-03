# Date & Time Fields

## Date

A date picker field.

```php
use TranquilTools\FormBuilder\Fields\Date;

Date::make('birthday')
    ->label('Date of birth')
    ->rules('required', 'date')
```

## DateTime

A date picker with time selection enabled. Equivalent to `Date::make()->enableTime()`.

```php
use TranquilTools\FormBuilder\Fields\DateTime;

DateTime::make('scheduled_at')
    ->label('Scheduled at')
    ->rules('required', 'date')
```

## Time

A time-of-day field. The value is `HH:MM` (24h), or `null` when left empty.

```php
use TranquilTools\FormBuilder\Fields\Time;

Time::make('starts_at')
    ->label('Starts at')
    ->step(15)
```

It validates with `date_format:H:i` and is `nullable` unless you call `->required()`. Requires
`tranquil-tools/laravel-form-builder` 1.2 or newer.

Typing is forgiving: on blur or Enter the input is normalized, so `9` becomes `09:00`, `930` and `0930` become
`09:30`, `9.30`, `9,30` and `9:30` become `09:30`, and `1430` becomes `14:30`. Input that is not a time, such as
`25:00` or `abc`, stays as typed and is marked invalid instead of being changed silently.

Focusing the input opens a list of times, scrolled to the slot nearest the current value (or the current time when
empty). ArrowUp and ArrowDown move by the step and wrap around midnight, Enter commits, Escape closes the list.

---

## Options

### Date range

Allow selecting a start and end date:

```php
Date::make('period')
    ->label('Period')
    ->range()
```

The field submits an array with `start` and `end` keys.

### Enable time on a Date field

```php
Date::make('published_at')
    ->label('Publish at')
    ->enableTime()
```

### Min and max date

Restrict selectable dates. Pass a date string in `Y-m-d` format, or any format recognized by the date picker:

```php
Date::make('appointment')
    ->label('Appointment')
    ->minDate(now()->toDateString())
    ->maxDate(now()->addMonths(3)->toDateString())
```

The picker greys out the days outside the bounds; the server does not check them unless you ask. Add
`->validateBounds()` to have the field add a `TranquilTools\FormBuilder\Rules\DateBounds` rule, or set
`dates.validate_bounds` to `true` in `config/form-builder.php` for every date field (`->validateBounds(false)` opts one
out again):

```php
Date::make('appointment')
    ->minDate(now()->toDateString())
    ->maxDate(now()->addMonths(3)->toDateString())
    ->validateBounds()
```

A date outside the bounds is rejected with "The appointment must be on or after 2026-10-12." (or "on or before", in
English and Dutch). For a range the start and the end are checked.

| Field | Bound | Compares |
|---|---|---|
| without a time | `Y-m-d` | the calendar date at the start of the value, like the picker |
| with a time | `Y-m-d` | the calendar date at the start of the value, so `2026-10-12T00:15:00+02:00` is the 12th |
| with a time | `Y-m-d H:i` | the moment: a value with an offset as such, a value without one and the bound in the application timezone |

Only bounds that start with a `Y-m-d` date are validated; anything else (such as `'today'`) is left to the browser,
which ignores it as well. Use the rule on its own with `new DateBounds('2026-10-01', '2026-10-31')`.

Requires `tranquil-tools/laravel-form-builder` 1.6 or newer.

### Disabled weekdays and dates

Grey out days that cannot be picked, next to (or instead of) `minDate` and `maxDate`. Weekdays count from `0` = Sunday
to `6` = Saturday, like `weekStartsOn`. Dates are `Y-m-d` strings or date objects; a range takes `from` and `to`, and
either end may be left out for an open-ended range:

```php
Date::make('arrival_on')
    ->label('Arrival')
    ->disabledWeekdays([0, 6])          // no weekends
    ->disabledDates([
        '2026-12-25',
        now()->addDay(),
        ['from' => '2026-07-20', 'to' => '2026-08-02'],
        ['from' => '2027-06-01'],       // everything from June 2027
    ])
```

A disabled day is shown struck through and cannot be clicked; the "Today" button is disabled on such a day. Calling
`->disabledDates()` again adds to the list.

The server rejects a disabled date as well: the field adds a `TranquilTools\FormBuilder\Rules\AvailableDate` rule to its
rules, so `validate()` and a FormRequest using `Form::rules()` both refuse it ("The arrival cannot be on that date.",
in English and Dutch). The rule reads the calendar date at the start of the value, so `2026-10-17`, `2026-10-17 10:00`
and `2026-10-17T10:00:00+02:00` are all the 17th. For a range the start and the end are checked, not the days between.

Use the rule on its own for a plain Laravel validator:

```php
use TranquilTools\FormBuilder\Rules\AvailableDate;

$request->validate([
    'arrival_on' => ['required', 'date', new AvailableDate([0, 6], ['2026-12-25'])],
]);
```

The standalone `DatePicker` takes the same as `disabled-weekdays` and `disabled-dates` props, see
[Standalone Components](../components.md#datepicker).

Requires `tranquil-tools/laravel-form-builder` 1.5 and `laravel-vue-form-builder` 1.8 or newer.

### Touch picker

`->touchPicker()` swaps the small popover for a picker made for phones and for people who find small controls hard.
The field shows a large date button and, with time enabled, a separate time button next to it. On a phone the date
button opens a sheet from the bottom of the screen with day buttons of 48 px, today ringed and "Today" and "Done"
buttons. The time button opens a sheet with the hour buttons on the left and, after a divider, a column of minute-step
buttons on the right. On a desktop (at least 640 px wide with a mouse or trackpad) both buttons open a compact popover
right under the button instead. Tablets and other touch screens keep the sheet, shown as a centred dialog from 640 px.
Nothing is typed, so no keyboard or scroll wheel opens on iOS.

```php
DateTime::make('starts_at')
    ->touchPicker()
    ->weekStartsOn(1)
    ->minuteStep(15)  // minute buttons :00 :15 :30 :45 (default 15)
    ->hours(7, 23)    // hour buttons 07 to 23 (default 0 to 23)
```

- `minDate`, `maxDate`, `disabledWeekdays`, `disabledDates`, `weekStartsOn`, `locale` and `timezone` work as on the
  regular picker. The value that is submitted is the same as well.
- Picking a day while no time is chosen yet fills in the first hour button (`00:00`, or the start of `hours()`) and
  opens the time sheet right after, so the value always matches what the buttons show.
- A field without a `required` rule gets a **Wissen** ("Clear") button in both sheets that empties it. Set it
  yourself with `->clearable()` or `->clearable(false)`.
- The value is built from the picked wall clock in the field's timezone, so a time in a daylight saving gap is not
  shifted by the browser.
- Each day button has its full date as label for screen readers, and both buttons announce that they open a dialog.
- A stored time outside `hours()` or between the minute steps (for example `06:10`) is still shown and selected.
- The date button shows the day as `di 12 november 2026` (short weekday, long month) in the form locale; `format()`
  does not apply to it.
- `range()` fields ignore `touchPicker()` and keep the regular picker.

Requires `tranquil-tools/laravel-form-builder` 1.10 and `laravel-vue-form-builder` 1.14 or newer. The desktop popover
needs `laravel-vue-form-builder` 1.15.

#### TouchTimePicker component

`TouchTimePicker` is the time half of the touch picker as a standalone component for a time on its own, for example
a start and an end time next to a separate date. It shows one time button ("Pick a time" until a time is chosen) that
opens the same hour and minute buttons, as a sheet on a phone and a popover on a desktop. The value is `HH:mm`.

```vue
<script setup lang="ts">
import { TouchTimePicker } from '@form-builder/components/ui/date-picker'
</script>

<template>
    <TouchTimePicker v-model="startsAt" label="From" :hour-from="7" :hour-to="23" :minute-step="30" :disabled-times="['19:00', '19:30']" />
    <TouchTimePicker v-model="endsAt" label="To" :times="['20:00', '20:30', '24:00']" :is-disabled="(time) => isTaken(time)" clearable />
</template>
```

- `hour-from`, `hour-to` and `minute-step` build the times to choose from (default 00:00 to 23:45 per 15 minutes).
  `times` replaces them with your own list, which may end on `24:00` for the end of the day.
- `disabled-times` and `is-disabled` disable single times. A minute button is disabled when its time in the chosen
  hour is disabled, an hour button when all its minutes are.
- Picking an hour keeps the chosen minute when that time is free and otherwise takes the first free minute, so the
  value is always a time that can be chosen. Picking a minute before an hour takes the first hour where it is free.
- `clearable` adds a "Clear" button that empties the value to `''`. `label` titles the sheet, `placeholder` replaces
  "Pick a time", and `disabled` and `readonly` lock the button.

Requires `laravel-vue-form-builder` 1.15 or newer.

### Week start

Set the first day of the week in the calendar. `0` = Sunday (default), `1` = Monday:

```php
Date::make('starts_on')
    ->weekStartsOn(1) // Monday
```

### Date format

Control the display format shown in the input with [Day.js format tokens](https://day.js.org/docs/en/display/format).
Without a format the picker shows the date the way the browser does for its locale:

```php
Date::make('expires_on')
    ->format('DD/MM/YYYY')

DateTime::make('starts_at')
    ->format('ddd D MMM YYYY, h:mm A')   // Sun 4 Oct 2026, 2:05 PM
```

| Token | Output | Token | Output |
|---|---|---|---|
| `YYYY` | `2026` | `H` / `HH` | `9` / `09` (24-hour) |
| `YY` | `26` | `h` / `hh` | `9` / `09` (12-hour) |
| `M` / `MM` | `1` / `01` | `A` / `a` | `PM` / `pm` |
| `MMM` / `MMMM` | `Oct` / `October` | `m` / `mm` | `5` / `05` |
| `D` / `DD` | `4` / `04` | `s` / `ss` | `9` / `09` |
| `d` | `0` (Sunday) to `6` | `SSS` | `000` |
| `dd` / `ddd` / `dddd` | `Su` / `Sun` / `Sunday` | `[text]` | `text`, as is |

Month and day names follow the field's `->locale()`, or the form's locale (`4 oktober` in Dutch). A field with a time
whose format shows no hour gets ` HH:mm` appended. Only the display changes: the field still submits `Y-m-d` (or
`Y-m-d H:i`), and it also reads a value stored in its own format, such as `04/10/2026` for `DD/MM/YYYY`.

Up to `laravel-vue-form-builder` 1.8 only `YYYY`, `MM`, `DD`, `HH` and `mm` were replaced; those formats show exactly as before.

### Locale

Set the locale for the displayed date, and for the month and day names in the picker. Without it the picker follows the
form's locale (see [Translations](../vue-usage.md#translations)):

```php
Date::make('event_date')
    ->locale('nl')
```

### Timezone

By default a date field with a time sends the wall-clock time the user picked, such as `2026-10-11 14:30`, without
saying in which timezone that is. Declare a timezone to make the value unambiguous:

```php
DateTime::make('starts_at')
    ->timezone('Europe/Amsterdam')

DateTime::make('starts_at')
    ->timezone(Date::BROWSER_TIMEZONE) // the timezone of whoever fills in the form
```

The picker then shows and edits the time in that timezone, whatever timezone the browser is in, and sends an ISO 8601
value with its UTC offset: `2026-10-11T14:30:00+02:00`. A value that comes in with an offset (such as Eloquent's
`2026-10-11T12:30:00.000000Z`) is shown in the field's timezone; a value without one is read in the application
timezone (`config('app.timezone')`), which the schema sends along as `serverTimezone`.

`FormConfig::validate()` (and `AbstractForm::validate()`) converts these values to the application timezone as
`Y-m-d H:i:s`, ready for an Eloquent `datetime` column. Validating through a FormRequest instead? Convert yourself with
`$form->normalizeValues($request->validated())` or a single field's `->normalizeValue($value)`.

Set a default for every field in `config/form-builder.php` under `dates.timezone`; `->timezone()` on a field wins over
it. A date without a time ignores the timezone: a calendar date has no offset.

### Time step

The interval of the times in the list and of the arrow keys, in minutes. Defaults to `15`:

```php
Time::make('starts_at')
    ->step(30)
```

### Min and max time

Limit the list and validation to a range. Adds `after_or_equal` and `before_or_equal` rules:

```php
Time::make('starts_at')
    ->min('08:00')
    ->max('18:00')
```

### Clearable

A time field that is not required shows a cross inside the field, on the right, that empties it. It is hidden while the field is empty, disabled or readonly. Override that with `->clearable(bool)`:

```php
Time::make('starts_at')
    ->clearable(false)
```
