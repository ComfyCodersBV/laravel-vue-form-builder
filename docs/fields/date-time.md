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

The field submits an array with `from` and `to` keys.

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

### Week start

Set the first day of the week in the calendar. `0` = Sunday (default), `1` = Monday:

```php
Date::make('starts_on')
    ->weekStartsOn(1) // Monday
```

### Date format

Control the display format shown in the input. Uses [Day.js format tokens](https://day.js.org/docs/en/display/format):

```php
Date::make('expires_on')
    ->format('DD/MM/YYYY')
```

### Locale

Set the locale for month names, day names, and other text in the picker:

```php
Date::make('event_date')
    ->locale('nl')
```

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

A time field that is not required shows a button to empty it. Override that with `->clearable(bool)`:

```php
Time::make('starts_at')
    ->clearable(false)
```
