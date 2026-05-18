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
