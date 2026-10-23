# Changelog

All notable changes to `laravel-vue-form-builder` will be documented in this file.

## Unreleased
* A draggable `TreeView` shares its drag state with its nested levels, so a node can be dropped on a node of another
  level; before, only drops within the same list arrived. A node is never dropped into its own subtree, and a node with
  `draggable: false` stays in place but still accepts drops.
* A `select` field takes a `search` function (through `fieldOverrides`) and then fetches its options while the user
  types, debounced 250 ms, from `minSearchLength` characters on. A stored value outside the results is kept and shown
  with `selectedLabel`. The combobox says "Typ om te zoeken" below the minimum and "Zoeken..." while a call runs.
* A one-column form spaces its fields `space-y-4` apart, the same vertical gap as the multi-column grid, so a form
  no longer needs a spacing class of its own to keep its inputs from touching. The fields now sit in one `div`
  inside the `form`, so a `space-y-*` class on the form itself no longer changes the gap between them.
* Test hooks for browser recordings: a named button, submit or delete field renders `data-testid="field-<name>"`
  (its confirm button `field-<name>-confirm`), a wysiwyg field wraps its editor in `field-<name>`, a repeater's add
  button is `field-<name>-add`, and every tab and its close button carry `<variant>-tab-<key>` and
  `<variant>-tab-<key>-close`. A date field's picker button gets the field name as `id`, like the other inputs.

## 1.10.1 - 2026-10-14
* A `tags` field that reaches its `max` keeps its input, read-only and narrow, instead of hiding it, so the keyboard
  focus stays in the field and Backspace still removes the last chip.
* A tag suggestion shows its value under the label only when the label does not already contain it, so
  `Jane Doe <jane@example.com>` no longer repeats the address.
* The Jodit adapter restores list bullets, numbers and the blockquote indent that the Tailwind preflight removes.

## 1.10.0 - 2026-10-13
* Add a `tags` field built on reka-ui `TagsInput` and `Combobox`. A comma, semicolon, Enter, Tab or blur turns the typed
  text into a chip, a pasted list is split on commas, semicolons and newlines, and Backspace and the arrow keys select
  and remove chips. With `emails` a chip that is no e-mail address is marked; a server error on one entry (`to.1`)
  marks that chip and shows its message. With `suggestionsUrl` the field fetches `GET {url}?q=` debounced and offers
  `[{ value, label }]` in a keyboard-navigable list; the chip then shows the label. `max` stops adding chips. A string
  default such as `"a@example.com, b@example.com"` is read as a list.
* A file field with `currentFiles` lists them above the upload input with name, link and size, each with its own remove
  toggle. The remove flag then holds the removed keys and posts them as `remove_<name>[]`.
* Wysiwyg profiles: a field with `features` hands them to its adapter as the new optional `features` prop. Quill, Jodit
  and HugeRTE map them to their own toolbar (Quill also to a `formats` whitelist) and leave out what they cannot do;
  HugeRTE drops a feature whose plugin is not imported and warns during development. `config` is laid over the profile,
  so explicit options win: plain objects are merged key by key (`modules.clipboard` keeps the profile's
  `modules.toolbar`) and arrays are replaced. The textarea ignores profiles. The features each adapter supports are listed in the WYSIWYG
  docs.
* New messages `currentFiles` and `invalidEmail`, in English and Dutch.
* Supports schema version `1.8` of `tranquil-tools/laravel-form-builder` (`^1.7`).
* The package now ships PHP for installers: `TranquilTools\VueFormBuilder\Support\Installer\InstallsFrontendAliases`
  gives an install command `installAliases([...])` for the Vite aliases and `installTsPaths([...])` for the
  `tsconfig.json` paths, so a third-party package adds its alias in two calls. `ViteConfigPatcher`,
  `TsConfigPatcher` and the `DetectsPagesDirectory` trait moved here from laravel-vue-crud-builder unchanged, which uses
  them from this release on. See [Installer Support](docs/installer.md).
* Requires `tranquil-tools/laravel-form-builder` ^1.7 (schema `1.8`) and `illuminate/console` and `illuminate/support`
  (11, 12 or 13). The PHP tests run on Pest, next to the Node
  and Vitest suites.

## 1.9.0 - 2026-10-12
* Date `format` now supports the common Day.js tokens: `YYYY`, `YY`, `M`, `MM`, `MMM`, `MMMM`, `D`, `DD`, `d`, `dd`,
  `ddd`, `dddd`, `H`, `HH`, `h`, `hh`, `m`, `mm`, `s`, `ss`, `SSS`, `A`, `a` and `[escaped text]`. Month and day names
  follow the picker's locale (`ddd D MMM YYYY` shows `Sun 4 Oct 2026`, `zo 4 okt 2026` in Dutch). Up to 1.8 only
  `YYYY`, `MM`, `DD`, `HH` and `mm` were replaced, although the docs promised Day.js; those formats show exactly as
  before, and a field with a time whose format shows no hour still gets ` HH:mm` appended. A value stored in the
  field's own format (`04/10/2026` for `DD/MM/YYYY`) is now read instead of shown as empty. The submitted value is
  unchanged. `formatDate()` and `parseFormattedDate()` are exported.
* `<Form>` takes the form's columns from the schema (`FormConfig::columns()` in laravel-form-builder 1.6); the
  `columns` prop still wins.
* The public types and the date helpers can be imported from `@form-builder/types/...`, the only path the CrudBuilder
  installer maps in `tsconfig.json`: `@form-builder/types/form-builder` re-exports `DisabledDate`, `FormColumns`,
  `FormLayout`, `FormTheme`, `FieldSlotProps`, `FormMessages`, `FormMessagesConfig` and the `HttpForm*` types, and the
  new `@form-builder/types/dates` exports `isUnavailableDate()`, `calendarDateOf()`, `formatDate()`, `formatHasTime()`,
  `parseFormattedDate()` and `DisabledDate`. The package root exports `isUnavailableDate`, `formatDate`,
  `parseFormattedDate` and `FormColumns` as well. Existing import paths keep working.
* Docs: server-side validation of `minDate`/`maxDate`, labels in validation messages, the Day.js token table,
  `FormConfig::columns()`, the order of translatable locale names and a TypeScript section in Installation.
* Supports schema version `1.7` of `tranquil-tools/laravel-form-builder` (`^1.6`), which adds the form-level `columns`.

## 1.8.0 - 2026-10-12
* Date fields and the standalone `DatePicker` take `disabledWeekdays` (`0` = Sunday … `6` = Saturday) and
  `disabledDates` (`'Y-m-d'` strings and `{ from?, to? }` ranges). Those days are struck through and cannot be
  clicked, and the "Today" button is disabled on such a day. The `DisabledDate` type is exported from the package root
  and from `components/ui/date-picker`.
* A section with `columns` (1 to 4) lays out its own fields in a responsive grid, and a field with `columnSpan` (a
  number or `full`) takes that many columns. A nested section without `columns` inherits the nearest section's. The
  `columns` prop of `Form` and `FormRenderer` now accepts `3` and `4` as well.
* Fix `fullWidth` given through `field-overrides` being ignored by the two-column grid, although the docs show it that
  way. `columnSpan` works there too.
* A radio option link with a `target` other than `_self` renders as a plain anchor with that target and
  `rel="noopener noreferrer"`, also for an internal link that would otherwise navigate through Inertia.
* Docs: new [Columns](docs/columns.md) page, disabled dates, the `DatePicker` component, link targets, friendly
  validation attribute names for translatable fields and money bound messages. Fix the date range docs, which named
  the submitted keys `from` and `to` instead of `start` and `end`.
* Supports schema version `1.6` of `tranquil-tools/laravel-form-builder` (`^1.5`), which adds `disabledWeekdays`,
  `disabledDates`, `columns`, `columnSpan` and option `target`.

## 1.7.0 - 2026-10-11
* **Icons now come from `@lucide/vue` instead of `lucide-vue-next`.** `@lucide/vue` is the maintained successor with
  the same icon names, and the one the current Laravel Vue starter kit installs, so most applications already have
  it. An application that only has `lucide-vue-next` runs `npm install @lucide/vue` when upgrading; nothing else
  changes. This is the one upgrade step in this release, which is why it is a minor and not a major.
* Add the `money` type: an amount edited as a localised decimal with its currency symbol (`1.234,50 €`, `$1,234.50`),
  held and submitted as whole minor units. Typing is forgiving (`12,5`, `12.50` and `€ 12,50` in Dutch); on blur the
  amount is formatted; text that is no amount stays as typed and is marked invalid.
* Add the `translatable` type: one value per locale as `{ nl: ..., en: ... }`, with a tab per locale (or stacked
  inputs), the inner field per locale, its errors under its own input and a dot on the tab of a locale with an error.
  A plain stored string loads into the default locale.
* A single checkbox and a toggle show their label once, next to the control, instead of above it as well. With a
  `checkboxLabel` the label stays above.
* `hideLabel` hides a label visually on any field and keeps it for screen readers; a horizontal layout then drops the
  label column.
* A password with `stored` shows a masked placeholder and the hint that leaving it empty keeps the stored value; with
  a `removeFlag` a "Remove the stored value" checkbox submits that flag.
* `<Form>` resets after a successful submit with `resetOnSuccess` from the schema or the `reset-on-success` prop. File
  fields always forget the chosen file (and untick their remove checkbox) after a successful submit, so a second
  submit does not upload it again.
* Errors whose key belongs to no field (`conflicts`, `form`, a failed HTTP request) show at the top of the form in a
  `role="alert"` block. The `form-errors` slot replaces it; `formErrors` is exposed on the component.
* A `GET` form submits as a query string through an Inertia GET visit with `preserveState` and `preserveScroll`,
  without blank values, to the current path when there is no action. `submitOnChange` (schema or prop) submits 300 ms
  after the last change; `submit-delay` changes that.
* Radio options show a `description` as text and an optional link (`href`, `linkLabel`) next to the label. Only
  relative, `http`, `https`, `mailto` and `tel` links render; a link starting with `/` navigates through Inertia.
* Fix radios grouped by the core (type `radios`) rendering as "Unknown field type".
* Fix a textarea without an `id` and `name`, so its label points at it.
* The sources pass `vue-tsc` in strict mode, so applications can type-check their pages together with them, and CI
  runs `npm run typecheck`. Fixes the reported errors in the radio group, the tree view slots, the Quill adapter and
  the missing HugeRTE Vue types.
* Built-in texts `storedValue`, `removeStoredValue` and `containsErrors` in English and Dutch.
* Supports schema version `1.5` of `tranquil-tools/laravel-form-builder` (`^1.4`), which adds `money`,
  `translatable`, `hideLabel`, `stored`, `resetOnSuccess`, `submitOnChange` and the option details.

## 1.6.0 - 2026-10-11
* Date fields with a time take a timezone (`timezone` and `serverTimezone` from the schema). The picker then shows and
  edits the time in that timezone, whatever the browser's is, and sends ISO 8601 with the offset
  (`2026-10-11T14:30:00+02:00`) instead of a bare wall-clock time. `browser` means the user's own timezone. Values
  without an offset are read in the server timezone. Without a timezone nothing changes.
* `<Form>` takes `action`, `method` and `defaults` props, so one schema serves a dialog per table row without cloning
  it. `defaults` merge over the schema defaults; when they change, the form loads them and clears its errors.
* Every built-in text is translatable. English is the default, Dutch is built in. The locale comes from the `locale`
  prop, `configureFormMessages({ locale })`, the schema's `locale` (the app locale, sent by the core), then `en`.
  `configureFormMessages({ messages })` adds a language or overrides single messages, the `messages` prop does so for
  one form. This replaces the hardcoded Dutch "Kies datum", "Vandaag", "Zoeken...", "Geselecteerd" and "Keys moeten
  uniek zijn." and the hardcoded English labels elsewhere. Weekday and month names follow the locale through `Intl`.
* File fields show the current file (`currentUrl`, `currentName`) as a link, with a thumbnail when it is an image
  (`preview: false` turns that off). With a `removeFlag` a "Remove current file" checkbox submits that flag.
* Add the `section` type: a heading with an optional description that groups fields. Its fields are ordinary form
  fields for values, conditions and errors; in two columns a section spans both and lays out its own fields in two.
* A form with a file and the method `PUT`, `PATCH` or `DELETE` is sent through Inertia as a `POST` with `_method`, as
  the HTTP transport already did, because PHP does not parse multipart bodies for other methods.
* The time inputs of the date picker have an aria label.
* Fix a date format with a time in it (`DD-MM-YYYY HH:mm`) showing the time twice.
* Fix a multiple select showing no placeholder at all.
* Supports schema version `1.4` of `tranquil-tools/laravel-form-builder` (`^1.3`), which adds `section`, the timezone,
  the current file, the remove flag and the form locale.

## 1.5.0 - 2026-10-02
* Add a `Time` field (type `time`) for a time of day as `HH:MM`. Typing is forgiving: on blur or Enter `9` becomes
  `09:00`, `930` becomes `09:30` and `9.30` becomes `09:30`; input that is no time stays as typed and is marked
  invalid. Focus opens a list of times in steps of `step` minutes (default 15, limited by `min` and `max`), scrolled to
  the current value or the current time. ArrowUp and ArrowDown move by the step and wrap around midnight, Enter
  commits, Escape closes. A field that is not required gets a clear button.
* Add a `PopoverAnchor` to the popover components.
* Supports schema version `1.3` of `tranquil-tools/laravel-form-builder` (`^1.2`), which adds the `time` type.

## 1.4.0 - 2026-10-01
* Buttons render an HTML label. `Button`, `Submit` and `DeleteButton` show `labelHtml` from the schema as-is, so an
  icon (or other markup) can sit on the button; a plain `label` stays text. `ariaLabel` from the schema becomes the
  button's `aria-label`, for icon-only buttons. The confirm dialog keeps showing the plain label.
* Supports schema version `1.2` of `tranquil-tools/laravel-form-builder` (`^1.1`), which adds `labelHtml` and
  `ariaLabel`. Older cores keep working; their buttons simply have no HTML label.

## 1.3.4 - 2026-10-01
* Bump the dev dependency `undici` to 7.30.0 for the TLS certificate validation bypass in `BalancedPool`. It only
  reaches the test suite through `jsdom`; nothing that ships changes.
* Bump the dev dependencies `vitest` to 4.1.11 and `brace-expansion` to 2.1.7 for their audit advisories.

## 1.3.3 - 2026-10-01
* Fix modal dialogs ignoring every click inside them. `DialogContent` bound all of its props onto reka's
  `DialogContent`, and Vue fills unset boolean props with `false`, so reka received `trapFocus: false` and
  `disableOutsidePointerEvents: false` instead of its modal defaults. The page kept `pointer-events: none` while the
  content never got it back, so a click inside landed on the overlay and closed the dialog. It now forwards only the
  props that were set, and forwards reka's events (`escapeKeyDown`, `pointerDownOutside`, `focusOutside`,
  `interactOutside`, `openAutoFocus`, `closeAutoFocus`) so an owner can intercept a dismissal.

## 1.3.2 - 2026-09-30
* Fix `->if()` conditions on a checkbox or toggle. An unticked field holds its false value (`'0'` by default), which is
  a truthy string in JavaScript, so a field behind `->if('form.is_active')` never disappeared. Conditions now see
  checkbox and toggle fields as real booleans; the values that are submitted stay exactly as they were.
* `Date` fields now honour `format` and `locale`. Both were declared on the form schema but not on a field, so the
  props never reached `DateField` and every date trigger rendered through the browser default: a Dutch admin saw
  `12/20/2026` for a field configured as `DD-MM-YYYY`. The stored value was never affected.

## 1.3.1 - 2026-09-17
* Allow @vueuse/core 15 in the peer range

## 1.3.0 - 2026-09-17
* Add `transport="http"` to `Form`, which submits over `fetch` and keeps the page where it is instead of going through
  Inertia. The built-in submitter sends the CSRF token Laravel expects, switches to `multipart/form-data` with a spoofed
  `_method` as soon as a field holds a file, and spreads nested values into `filters[status][0]=open` style query
  parameters. Pass your own `submitter` and `errorAdapter` to talk to an API that answers in another shape.
* Add `columns="2"` for a responsive two-column form and `layout="horizontal"` for labels beside their control. A
  single-column form still renders exactly the markup it did before, without a wrapper element around the fields.
* Add a `ColorField` with optional swatches, a `clearable` single `Select` that can be emptied again, and the
  `TreeView`, `SortableList` and `Tabs` components for the screens around a form.
* A field whose name collides with the form API (`data`, `errors`, `reset`, `post`, …) now throws on setup instead of
  silently replacing that method.

## 1.2.4 - 2026-09-17
* Fix a checkbox or toggle nobody touches being submitted as an empty string. Laravel's `ConvertEmptyStringsToNull`
  middleware turns that into `null`, which a `NOT NULL` boolean column refuses, so saving a form with an unticked box
  ended in an integrity constraint violation. Such a field now starts on its own `falseValue`, the same value it gets
  when you tick it off yourself. A stored `false` still reads as false, and a stored `null` is read as false too.

## 1.2.3 - 2026-08-27
* Fix the autofocus of the search field in a searchable `Select` and in `MultiSelect`: it relied on the `openAutoFocus`
  event of the popover, which does not fire in every host application. The focus is now applied when the dropdown opens.

## 1.2.2 - 2026-08-26
* The search field of a searchable `Select` and of `MultiSelect` now receives focus as soon as the dropdown opens, so
  you can type without clicking the field first.

## 1.2.1 - 2026-08-18
* Bump nanoid to 3.3.18 to close the advisory

## 1.2.0 - 2026-08-14

**Upgrade note — the PHP now lives in `tranquil-tools/laravel-form-builder`.** This package is the
Vue renderer and requires the core, so `composer update` pulls it in and no application code changes:
the `TranquilTools\FormBuilder\` namespace is unchanged. Two things move. The config file is now
`config/form-builder.php`, published with `--tag="form-builder-config"`; an existing
`config/vue-form-builder.php` still works and its values win, with a deprecation warning under
`APP_DEBUG`. Translations answer to `form-builder::` as well as the old `vue-form-builder::`.

**Upgrade note — WYSIWYG editors are now opt-in.** If you use `->editor('quill')`, or leave
`default-editor` at `quill`, add two lines to your app entrypoint:

```ts
import QuillEditor from '@form-builder/wysiwyg/QuillEditor.vue';
import { registerWysiwygEditor } from '@form-builder/wysiwyg/registry';

registerWysiwygEditor('quill', QuillEditor);
```

Without it those fields render a textarea plus a development warning instead of crashing.

* Add a WYSIWYG editor registry and a documented, engine-agnostic adapter contract: HTML in, HTML out,
  with `->options()` passed through untouched as the adapter's `config` prop.
* The package imports no editor implementation, so `npm run build` no longer fails in projects that
  never installed Quill. The Quill adapter moved to `resources/js/wysiwyg/QuillEditor.vue`.
* Drop `quill-image-resize-module` — unmaintained since 2022 and pinned to Quill 1. Registering Quill
  now needs `vue-quilly quill` instead of three packages.
* Add the `hugerte` and `jodit` adapters, both MIT, both opt-in like Quill. HugeRTE is the community
  fork of TinyMCE 6 and the migration path off TinyMCE 7's GPL; Jodit is driven through its engine API
  directly, with only the free `jodit` package supported. A third fixture builds both and asserts they
  reach the bundle.
* `package.json` declares the real import closure as `peerDependencies` with supported ranges
  (`reka-ui: ^2.9.4` among them), editor engines optional. It previously listed `reka-ui` as a
  dependency, which resolves nothing. Nothing to do unless your versions fall outside a range.
* The manifest, lockfile and CI config are `export-ignore`d, keeping dist installs to what consumers
  actually use.
* Two fixture applications in `tests/fixtures/` build the package the way a real project does and
  assert, in CI, that an engine reaches the bundle only when registered.
* Move the PHP core — fields, validation, config, translations, stubs, service provider and the
  `make:` commands — to `tranquil-tools/laravel-form-builder`, required from here. This package now
  ships `resources/js` and `docs` only and declares no `autoload`, so exactly one package owns the
  namespace. What produces schema is core; what reads schema is this renderer.
* Refuse to render a schema whose major `schemaVersion` this renderer does not implement: an error
  during development, a console warning in production. A core that adds a field type the renderer
  does not know can no longer render it as silently nothing.
* The editor registry guard runs on Node (`npm test`) instead of Pest, since the package no longer
  contains PHP. Same three assertions.
* Theme the wrapper, label, help text and error message of every field from `config/form-builder.php`
  or per field with `->theme([...])`. Layers merge through `tailwind-merge`, so overriding a colour
  keeps the size. Requires the core at `^1.0.1`. See [Theming](docs/theming.md).
* `<Form>` accepts a slot per field name, and per field type, replacing that field's rendering
  entirely. Name beats type. Slots reach fields nested inside a `Repeater` too.
* Fix: `->class()` was ignored by the checkbox, checkboxes, radio, toggle and WYSIWYG fields, which
  never passed it on to their wrapper. It now sets the wrapper class on every field type, as
  documented. If you relied on it doing nothing there, those wrappers change. As part of this the
  WYSIWYG field stops handing the class to its fallback textarea — that applied only when no editor
  was registered, and `className` is not part of the adapter contract.

## 1.1.2 - 2026-07-30
* Add `->stepper()` to the `Number` field, rendering increment/decrement buttons around the input.
* Add `->searchable()` to the `Select` field for a searchable combobox variant.
* Fix: `Select`, `Popover`, `MultiSelect`, and `DatePicker` content now portals into the nearest open InertiaUI modal instead of `body`, so dropdowns and comboboxes render above the modal instead of behind it.
* Add translatable labels for the stepper buttons and searchable select (`vue-form-builder::fields`), following the same pattern as button labels.

## 1.1.1 - 2026-07-29
* Fix: `DatePicker` no longer invents a date from an unparseable value. A `d-m-Y` string such as `29-07-2026` was read as `Y-m-d` and became a date in 1935, which could then be saved back over the stored value. `parseDate` now returns `null` unless the value is `Y-m-d` (optionally followed by a time) or an ISO 8601 string, and out-of-range months and days are rejected. An unparseable value renders the placeholder and emits nothing.

## 1.1.0 - 2026-07-17
* Fix: file fields no longer seed a stored string value (e.g. an existing filename) into the form, which caused `mimetypes` validation to fail when submitting without choosing a new file.
* Add `Repeater` field for repeatable groups of sub-fields (e.g. ingredient rows, steps), with add/remove/reorder, `min`/`max`, `itemLabel`, and `inline()` for horizontal row layout. Sub-field validation rules are expanded server-side into dotted wildcard rules (`name.*.subfield`).
* Add `buttons()` display variant to the `Checkboxes` field, rendering options as toggle pills instead of checkboxes.
* Add test coverage for all field types.

## 1.0.25 - 2026-07-03
* Add masked password/secret/token input support to KeyValue field with configurable pattern

## 1.0.24 - 2026-06-27
* Unify Button, Submit, and DeleteButton into shared base with variant support, confirm dialogs, and translatable labels (en/nl)

## 1.0.23 - 2026-06-23
* Fix `TextareaField` class passing to `BaseField` instead of `Textarea` component.

## 1.0.22 - 2026-06-04
* Add `options` prop to `Form` — passed as Inertia visit options (e.g. `{ preserveScroll: true }`) and merged into the form submission call

## 1.0.21 - 2026-05-26
* Set default label `'Save'` on `Submit` field so it serializes a non-null value — prevents Vue's `withDefaults` from being bypassed by `null`

## 1.0.20 - 2026-05-18
* Add `fieldOverrides` prop to `Form` and `FormRenderer` — reactive `Record<fieldName, Partial<Field>>` merged at render time, enabling dynamic field attribute changes (e.g. lock/unlock a field based on another field's value)

## 1.0.19 - 2026-05-18
* Add `onFieldChange` prop to `Form` and `FormRenderer` — callback `(field, value, form) => void` fires on any field change, enabling cross-field reactivity from the parent page

## 1.0.18 - 2026-05-18
* Add `->readonlyValueKeys(array)` to `KeyValue` field — marks specific keys' value inputs as readonly while keeping other rows editable

## 1.0.17 - 2026-05-12
* Add `->if('condition')` support on all fields for conditional visibility; supports both `form.fieldName` and bare `fieldName` reference syntax

## 1.0.16 - 2026-05-04
* Add an optional `->checkboxLabel(...)` to CheckboxField for customizing the label text of the checkbox itself, separate from the field label

## 1.0.15 - 2026-04-17
* Add Laravel 13 support

## 1.0.14 - 2026-04-07
* Update Reka UI dependecy to resolve Defu 6.1.4 vulnerability

## 1.0.13 - 2026-03-19
* Fix FormRenderer to render as a fragment (no wrapper div) so per-field className (e.g. col-span-N) participates in the parent form's grid layout
* Fix SubmitButton stretching full-width in grid layouts
* Fix SelectField and DateField to pass className through to BaseField wrapper

## 1.0.12 - 2026-03-19
* Fix DateField/DatePicker to support disabled and readonly props
* Fix DatePicker to correctly parse ISO 8601 date strings (e.g. from Laravel's Carbon serialization)

## 1.0.11 - 2026-03-19
* Fix FileField to emit File objects instead of string values

## 1.0.10 - 2026-03-18
* Fix for File::accept() to support both array and variadic string arguments

## 1.0.9 - 2026-02-25
* Quill fix: prevent duplicating the content after toggling the source code editor

## 1.0.8 - 2026-02-25
* Quill fix: remove &nbsp; replacement from text-change to prevent infinite loop

## 1.0.7 - 2026-02-25
* Quill fix: replace &nbsp; entities with regular spaces in all HTML output

## 1.0.6 - 2026-02-25
* Force Quill to preserve HTML structure and prevent extra line breaks
* Implement configurable HTML source editor toggle button for the Quill wysiwyg

## 1.0.5 - 2026-02-25
* Improve Quill wysiwyg's loading of initial HTML & reactiveness

## 1.0.4 - 2026-02-24
* Implement Recaptcha-field

## 1.0.3 - 2026-02-23
* Fix for setting a ->default(...) value in (multi)selects

## 1.0.2 - 2026-02-20
* Fix to avoid empty postdata
* Implement @succes event for closing modals, etc.

## 1.0.1 - 2026-02-20
* Improve handling of form values using Inertia's useForm
* This fixes an issue with the Quill wysiwyg values

## 1.0.0 - 2026-02-18
* Initial release
