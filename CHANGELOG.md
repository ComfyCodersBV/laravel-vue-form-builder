# Changelog

All notable changes to `laravel-vue-form-builder` will be documented in this file.

## 1.2.0 - unreleased

**Upgrade note — WYSIWYG editors are now opt-in.**

The package no longer imports any editor implementation. This fixes a build-time problem: because Vite
resolves bare specifiers against the *application's* `node_modules`, every consumer inherited Quill's
npm packages and `npm run build` failed without them, even in projects that never render a WYSIWYG field.

If you use `->editor('quill')` (or leave `default-editor` at `quill`), add two lines to your app entrypoint:

```ts
import QuillEditor from '@form-builder/wysiwyg/QuillEditor.vue';
import { registerWysiwygEditor } from '@form-builder/wysiwyg/registry';

registerWysiwygEditor('quill', QuillEditor);
```

Without it, those fields render a textarea plus a `console.warn` in development instead of crashing.

* Add a WYSIWYG editor registry (`@form-builder/wysiwyg/registry`) with `registerWysiwygEditor`,
  `resolveWysiwygEditor` and `registeredWysiwygEditors`.
* Add a documented, engine-agnostic adapter contract (`@form-builder/wysiwyg/types`): HTML in, HTML out,
  with `->options()` passed through untouched as the adapter's `config` prop.
* Move the Quill adapter to `resources/js/wysiwyg/QuillEditor.vue`. Nothing in the package imports it.
* Drop `quill-image-resize-module`. It has been unmaintained since 2022 and declares `quill: ^1.2.2`,
  while this adapter runs Quill 2. Its config block was removed from `vue-form-builder.php`, and the
  `window.Quill` global plus the Parchment `StyleAttributor` shim that existed only to feed it are gone.
  Consumers registering Quill now install `vue-quilly quill` — two packages instead of three.
* An unknown or unregistered editor key falls back to a textarea. `textarea` keeps working without
  registration.

**Repository hygiene**, released together with the same change in table-builder and crud-builder:

* `package.json` now declares the package's real import closure as `peerDependencies` with supported
  ranges — `reka-ui: ^2.9.4`, `vue: ^3.5`, `@inertiajs/vue3: >=2 <4`, `@vueuse/core: >=12 <15`,
  `lucide-vue-next: >=0.556 <2`, `tailwind-merge: ^3.0`, `clsx: ^2.0`,
  `class-variance-authority: >=0.7 <1` — with `quill` and `vue-quilly` marked optional. It previously
  listed `reka-ui` as a `dependency`, which resolves nothing: Vite reads the application's
  `node_modules`, never this file. Nothing to do on upgrade unless your versions fall outside a range.
* The manifest, its lockfile and the CI configuration are `export-ignore`d, so `--prefer-dist`
  installs no longer carry files that look authoritative inside `vendor/` but are not.
* Two fixture applications in `tests/fixtures/` build the package the way a real project does: one
  without any editor engine installed, asserting none reaches the bundle, and one with Quill
  installed and registered, asserting it does. Both run in CI, plus a matrix build against the lowest
  and highest supported `reka-ui`.

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
