# Changelog

All notable changes to `laravel-vue-form-builder` will be documented in this file.

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
