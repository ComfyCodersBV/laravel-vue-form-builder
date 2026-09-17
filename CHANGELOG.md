# Changelog

All notable changes to `laravel-vue-form-builder` will be documented in this file.

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
