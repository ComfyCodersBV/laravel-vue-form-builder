# Filter Forms (GET)

A form with `method('GET')` submits its values as a query string through an Inertia GET visit. That is all a filter
bar, a year switcher or a search box needs: the URL holds the filter, a reload or a shared link shows the same result,
and the controller reads plain query parameters.

```php
class BookingFilterForm extends AbstractForm
{
    public function configure(FormConfig $form): void
    {
        $form
            ->method('GET')
            ->action(route('bookings.index'))
            ->submitOnChange();
    }

    public function fields(): array
    {
        return [
            Select::make('year')
                ->label('Year')
                ->hideLabel()
                ->options([2025 => '2025', 2026 => '2026']),

            Text::make('q')
                ->label('Search')
                ->hideLabel()
                ->placeholder('Search…'),
        ];
    }
}
```

```php
public function index(Request $request): Response
{
    return Inertia::render('Bookings/Index', [
        'filters' => BookingFilterForm::make()->fill(['year' => now()->year]),
        'bookings' => Booking::query()
            ->whereYear('starts_at', $request->integer('year', now()->year))
            ->when($request->filled('q'), fn ($query) => $query->where('title', 'like', '%'.$request->input('q').'%'))
            ->paginate(),
    ]);
}
```

## What a GET form does

- **The current query is the default.** A GET form fills its fields from the query string of the request, over what
  `fill()` set, so the form shows the filter the page was loaded with. `->fillFromQuery(false)` turns that off, and
  `->fillFromQuery()` turns it on for any other method.
- **Blank values stay out of the URL.** Empty strings, `null` and empty arrays are dropped: `?year=2026`, not
  `?year=2026&q=`.
- **State and scroll are kept.** The visit uses `preserveState` and `preserveScroll`, so the filter bar keeps focus and
  the page does not jump. Pass `:options="{ only: ['bookings'] }"` for a partial reload, or any other visit option.
- **No action means this page.** Without an action the visit goes to the current path.

## Submit on change

`->submitOnChange()` (or the `submit-on-change` prop) submits shortly after every change, so a filter needs no button.
Changes within 300 ms are combined into one visit, so typing in a search box does not fire a visit per key. The
`submit-delay` prop changes the pause, in milliseconds.

```vue
<Form :schema="filters" :submit-delay="500" class="flex gap-2" />
```

It works for any method, but is meant for GET forms: a POST on every keystroke is rarely what you want.
