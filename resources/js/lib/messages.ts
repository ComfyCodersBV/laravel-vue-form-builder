import { computed, inject, reactive, type ComputedRef, type InjectionKey } from 'vue';

export interface FormMessages {
    pickDate: string;
    pickPeriod: string;
    previousMonth: string;
    nextMonth: string;
    today: string;
    lastSevenDays: string;
    thisMonth: string;
    hours: string;
    minutes: string;
    clear: string;
    clearAll: string;
    search: string;
    noResults: string;
    chooseOption: string;
    select: string;
    selected: string;
    remove: string;
    decrement: string;
    increment: string;
    key: string;
    value: string;
    addRow: string;
    showValue: string;
    hideValue: string;
    duplicateKeys: string;
    addItem: string;
    moveUp: string;
    moveDown: string;
    unsavedChanges: string;
    expand: string;
    collapse: string;
    currentFile: string;
    removeCurrentFile: string;
    currentFiles: string;
    invalidEmail: string;
    unknownFieldType: string;
    storedValue: string;
    removeStoredValue: string;
    containsErrors: string;
    typeToSearch: string;
    searching: string;
    searchFailed: string;
}

export const en: FormMessages = {
    pickDate: 'Pick a date',
    pickPeriod: 'Pick a period',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    today: 'Today',
    lastSevenDays: 'Last 7 days',
    thisMonth: 'This month',
    hours: 'Hours',
    minutes: 'Minutes',
    clear: 'Clear field',
    clearAll: 'Clear',
    search: 'Search...',
    noResults: 'No results',
    chooseOption: 'Choose an option',
    select: 'Select...',
    selected: 'Selected',
    remove: 'Remove',
    decrement: 'Decrease',
    increment: 'Increase',
    key: 'Key',
    value: 'Value',
    addRow: 'Add row',
    showValue: 'Show value',
    hideValue: 'Hide value',
    duplicateKeys: 'Keys must be unique.',
    addItem: 'Add item',
    moveUp: 'Move up',
    moveDown: 'Move down',
    unsavedChanges: 'Unsaved changes',
    expand: 'Expand',
    collapse: 'Collapse',
    currentFile: 'Current file',
    removeCurrentFile: 'Remove current file',
    currentFiles: 'Current files',
    invalidEmail: 'Not a valid e-mail address',
    unknownFieldType: 'Unknown field type:',
    storedValue: 'A value is stored. Leave this empty to keep it.',
    removeStoredValue: 'Remove the stored value',
    containsErrors: 'Contains errors',
    typeToSearch: 'Type to search',
    searching: 'Searching...',
    searchFailed: 'Searching failed, try again',
};

export const nl: FormMessages = {
    pickDate: 'Kies datum',
    pickPeriod: 'Kies periode',
    previousMonth: 'Vorige maand',
    nextMonth: 'Volgende maand',
    today: 'Vandaag',
    lastSevenDays: 'Laatste 7 dagen',
    thisMonth: 'Deze maand',
    hours: 'Uren',
    minutes: 'Minuten',
    clear: 'Veld leegmaken',
    clearAll: 'Wissen',
    search: 'Zoeken...',
    noResults: 'Geen resultaten',
    chooseOption: 'Kies een optie',
    select: 'Selecteer...',
    selected: 'Geselecteerd',
    remove: 'Verwijderen',
    decrement: 'Verlagen',
    increment: 'Verhogen',
    key: 'Sleutel',
    value: 'Waarde',
    addRow: 'Rij toevoegen',
    showValue: 'Waarde tonen',
    hideValue: 'Waarde verbergen',
    duplicateKeys: 'Sleutels moeten uniek zijn.',
    addItem: 'Item toevoegen',
    moveUp: 'Omhoog',
    moveDown: 'Omlaag',
    unsavedChanges: 'Niet-opgeslagen wijzigingen',
    expand: 'Uitklappen',
    collapse: 'Inklappen',
    currentFile: 'Huidig bestand',
    removeCurrentFile: 'Huidig bestand verwijderen',
    currentFiles: 'Huidige bestanden',
    invalidEmail: 'Geen geldig e-mailadres',
    unknownFieldType: 'Onbekend veldtype:',
    storedValue: 'Er is een waarde opgeslagen. Laat dit leeg om die te houden.',
    removeStoredValue: 'Opgeslagen waarde verwijderen',
    containsErrors: 'Bevat fouten',
    typeToSearch: 'Typ om te zoeken',
    searching: 'Zoeken...',
    searchFailed: 'Zoeken is mislukt, probeer het opnieuw',
};

export const DEFAULT_LOCALE = 'en';

interface MessagesState {
    locale?: string;
    catalogues: Record<string, Partial<FormMessages>>;
}

const state = reactive<MessagesState>({
    locale: undefined,
    catalogues: {
        en: { ...en },
        nl: { ...nl },
    },
});

export interface FormMessagesConfig {
    locale?: string;
    messages?: Record<string, Partial<FormMessages>>;
}

export function configureFormMessages(config: FormMessagesConfig): void {
    if (typeof config.locale !== 'undefined') {
        state.locale = config.locale;
    }

    Object.entries(config.messages ?? {}).forEach(([locale, messages]) => {
        state.catalogues[locale] = {
            ...(state.catalogues[locale] ?? {}),
            ...messages,
        };
    });
}

export function resetFormMessages(): void {
    state.locale = undefined;
    state.catalogues = {
        en: { ...en },
        nl: { ...nl },
    };
}

function catalogueFor(locale: string): Partial<FormMessages> {
    const language = locale.split(/[-_]/)[0];

    return {
        ...(state.catalogues[language] ?? {}),
        ...(state.catalogues[locale] ?? {}),
    };
}

export function resolveLocale(...candidates: Array<string | null | undefined>): string {
    return [candidates[0], state.locale, ...candidates.slice(1)]
        .find((locale): locale is string => typeof locale === 'string' && locale !== '')
        ?? DEFAULT_LOCALE;
}

export function resolveMessages(locale: string, overrides: Partial<FormMessages> = {}): FormMessages {
    return {
        ...en,
        ...catalogueFor(DEFAULT_LOCALE),
        ...catalogueFor(locale),
        ...overrides,
    };
}

export interface MessagesContext {
    locale: string;
    messages: FormMessages;
}

export const messagesKey: InjectionKey<ComputedRef<MessagesContext>> = Symbol('form-builder-messages');

export function useFormMessages(): ComputedRef<MessagesContext> {
    const injected = inject(messagesKey, null);

    if (injected) {
        return injected;
    }

    return computed(() => {
        const locale = resolveLocale();

        return {
            locale,
            messages: resolveMessages(locale),
        };
    });
}
