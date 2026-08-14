# Build fixtures

Two minimal Vite applications that consume `resources/js` through the `@form-builder` alias, the
same way a real project does. They exist because the guard in `tests/wysiwyg` reads source files,
and a real build is the only thing that proves what actually reaches a bundle.

| Fixture | Installs an engine | Registers an adapter | Asserts |
|---|---|---|---|
| `bare-app` | no | no | no editor engine in the bundle |
| `quill-app` | yes | yes | the Quill adapter *is* in the bundle |
| `engines-app` | yes | yes | the HugeRTE and Jodit adapters *are* in the bundle |

Run any of them with:

```bash
npm ci                        # in the package root, for the engines
cd tests/fixtures/bare-app
npm ci
npm run verify
```

The first `npm ci` is not optional. Bare specifiers inside `resources/js` resolve upwards from that file, never from a
fixture below it, so the adapters compile against the engines this package holds as devDependencies. Installing an
engine in a fixture alone is not enough to build an adapter that imports it.

## Why the assertion inspects the bundle instead of trusting the build to fail

Every engine is resolvable from `resources/js`, because the package installs them all as
devDependencies so its adapters can be compiled. A reintroduced import therefore resolves happily,
the build stays green, and the engine is bundled silently. The same happens when this package is
checked out inside a larger project that has an engine installed — a `vendor/` directory during
development, for instance. Only inspecting the emitted assets catches it, so `verify-bundle.mjs`
greps them for engine markers.

`quill-app` and `engines-app` make the opposite assertion on purpose. Without them, `bare-app` could
pass for the wrong reason: a moved, renamed or broken adapter also yields a bundle with no engine in
it.

## Maintenance

Each fixture carries a committed `package-lock.json` so CI can use `npm ci`. Their dependency lists
are the real import closure of `resources/js` — currently `vue`, `reka-ui`, `lucide-vue-next`,
`@vueuse/core`, `@inertiajs/vue3`, `tailwind-merge`, `clsx` and `class-variance-authority`, plus
whichever engines that fixture registers. A new bare specifier anywhere in the package means adding
it here too, which is intentional friction: it makes the cost of a new frontend dependency visible
in review.
