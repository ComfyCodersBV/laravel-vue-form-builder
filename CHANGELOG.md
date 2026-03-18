# Changelog

All notable changes to `laravel-vue-form-builder` will be documented in this file.

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
