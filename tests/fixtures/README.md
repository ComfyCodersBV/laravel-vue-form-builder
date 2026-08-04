# Build fixtures

Two minimal Vite applications that consume `resources/js` through the `@form-builder` alias, the
same way a real project does. They exist because the Pest guard in `tests/Wysiwyg` reads source
files, and a real build is the only thing that proves what actually reaches a bundle.

| Fixture | Installs an engine | Registers an adapter | Asserts |
|---|---|---|---|
| `bare-app` | no | no | no editor engine in the bundle |
| `quill-app` | yes | yes | the Quill adapter *is* in the bundle |

Run either one with:

```bash
cd tests/fixtures/bare-app
npm ci
npm run verify
```

## Why the assertion inspects the bundle instead of trusting the build to fail

Node resolution walks upwards out of the fixture. When this package is checked out inside a larger
project that happens to have `quill` installed — a `vendor/` directory during development, for
instance — a reintroduced import resolves against that outer `node_modules`, the build stays green,
and the engine is bundled silently. `verify-bundle.mjs` greps the emitted assets for engine markers,
which holds in both a standalone clone and a nested checkout.

`quill-app` makes the opposite assertion on purpose. Without it, `bare-app` could pass for the wrong
reason: a moved, renamed or broken adapter also yields a bundle with no engine in it.

## Maintenance

Both fixtures carry a committed `package-lock.json` so CI can use `npm ci`. Their dependency lists
are the real import closure of `resources/js` — currently `vue`, `reka-ui`, `lucide-vue-next`,
`@vueuse/core`, `@inertiajs/vue3`, `tailwind-merge`, `clsx` and `class-variance-authority`. A new
bare specifier anywhere in the package means adding it here too, which is intentional friction: it
makes the cost of a new frontend dependency visible in review.
