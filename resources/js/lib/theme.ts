import type { InjectionKey, Ref } from 'vue';
import { cn } from './utils';

/**
 * Classes for the chrome every field renders around its own control: the
 * wrapper, the label, the help text and the error message.
 *
 * Three layers, each overriding the one before it: these defaults, the theme
 * the PHP core carries in the schema (`config('form-builder.theme')`), and a
 * field's own `->theme([...])`. Merging goes through `cn`, so tailwind-merge
 * resolves conflicts in favour of the later layer instead of emitting both.
 */
export interface FormTheme {
    wrapper: string;
    label: string;
    help: string;
    error: string;
}

export const DEFAULT_THEME: FormTheme = {
    wrapper: 'space-y-1',
    label: 'block text-sm font-medium text-neutral-800 dark:text-neutral-200',
    help: 'mt-1 text-xs text-neutral-500 dark:text-neutral-400',
    error: 'text-sm text-red-600',
};

export const themeKey: InjectionKey<Ref<FormTheme>> = Symbol('form-builder-theme');

export function mergeTheme(base: FormTheme, overrides?: Partial<FormTheme> | null): FormTheme {
    if (!overrides) {
        return base;
    }

    const merged = { ...base };

    for (const element of Object.keys(base) as (keyof FormTheme)[]) {
        const override = overrides[element];

        if (typeof override === 'string' && override !== '') {
            merged[element] = cn(base[element], override);
        }
    }

    return merged;
}
